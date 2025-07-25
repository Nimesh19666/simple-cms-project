<?php

// File: app/Jobs/GenerateArticleDetails.php - Enhanced with better error handling

namespace App\Jobs;

use App\Models\Article;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GenerateArticleDetails implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3; // Retry up to 3 times
    public $backoff = [10, 30, 60]; // Wait 10s, 30s, 60s between retries

    public function __construct(public Article $article)
    {
        //
    }

    public function handle(): void
    {
        try {
            Log::info("Starting AI processing for article: {$this->article->id}");

            $this->generateSlug();
            $this->generateSummary();

            Log::info("AI processing completed successfully for article: {$this->article->id}");
        } catch (\Exception $e) {
            Log::error("AI Generation Failed for article {$this->article->id}: " . $e->getMessage());
            $this->handleFallback();
        }
    }

    private function generateSlug(): void
    {
        try {
            $geminiApiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');

            if (!$geminiApiKey) {
                throw new \Exception('Gemini API key not configured');
            }

            $prompt = "Create a short, SEO-friendly URL slug (max 60 characters) from this title. Return ONLY the slug with hyphens, no quotes or extra text: " . $this->article->title;

            $response = Http::timeout(30)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={$geminiApiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $generatedSlug = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

                // Clean and validate the slug
                $slug = $this->cleanSlug($generatedSlug);
                $uniqueSlug = $this->makeSlugUnique($slug);

                $this->article->update(['slug' => $uniqueSlug]);
                Log::info("Slug generated successfully: {$uniqueSlug}");
            } else {
                throw new \Exception('Gemini API call failed: ' . $response->status() . ' - ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("Slug generation failed for article {$this->article->id}: " . $e->getMessage());
            $this->generateFallbackSlug();
        }
    }

    private function generateSummary(): void
    {
        try {
            $geminiApiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');

            if (!$geminiApiKey) {
                throw new \Exception('Gemini API key not configured');
            }

            $contentPreview = Str::limit($this->article->content, 3000);
            $prompt = "Summarize this article content in exactly 2-3 clear sentences. Make it engaging and informative:\n\n" . $contentPreview;

            $response = Http::timeout(30)->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={$geminiApiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $summary = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

                // Clean the summary
                $cleanSummary = trim(strip_tags($summary));

                if (strlen($cleanSummary) > 10) { // Only update if we got a meaningful summary
                    $this->article->update(['summary' => $cleanSummary]);
                    Log::info("Summary generated successfully for article: {$this->article->id}");
                } else {
                    throw new \Exception('Generated summary too short or empty');
                }
            } else {
                throw new \Exception('Gemini API call failed: ' . $response->status() . ' - ' . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("Summary generation failed for article {$this->article->id}: " . $e->getMessage());
            $this->generateFallbackSummary();
        }
    }

    private function cleanSlug(string $slug): string
    {
        // Remove quotes, extra spaces, and convert to proper slug format
        $slug = trim($slug, '"\'` ');
        $slug = Str::slug($slug);

        // Ensure it's not too long
        return Str::limit($slug, 60, '');
    }

    private function makeSlugUnique(string $slug): string
    {
        $originalSlug = $slug;
        $counter = 1;

        while (Article::where('slug', $slug)->where('id', '!=', $this->article->id)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    private function generateFallbackSlug(): void
    {
        $slug = Str::slug($this->article->title);
        $uniqueSlug = $this->makeSlugUnique($slug . '-' . time());

        $this->article->update(['slug' => $uniqueSlug]);
        Log::info("Fallback slug generated: {$uniqueSlug}");
    }

    private function generateFallbackSummary(): void
    {
        // Create a simple summary from first 2 sentences
        $sentences = preg_split('/[.!?]+/', $this->article->content);
        $firstSentences = array_slice($sentences, 0, 2);
        $summary = implode('. ', array_filter($firstSentences));

        if (strlen($summary) > 10) {
            $summary .= '.';
        } else {
            $summary = Str::limit($this->article->content, 150) . '...';
        }

        $this->article->update(['summary' => $summary]);
        Log::info("Fallback summary generated for article: {$this->article->id}");
    }

    private function handleFallback(): void
    {
        $this->generateFallbackSlug();
        $this->generateFallbackSummary();
        Log::info("Fallback processing completed for article: {$this->article->id}");
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Job completely failed for article {$this->article->id}: " . $exception->getMessage());
        $this->handleFallback();
    }
}
