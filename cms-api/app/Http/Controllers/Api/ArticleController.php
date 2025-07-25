<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Jobs\GenerateArticleDetails;
use Illuminate\Support\Facades\Log;


class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $query = Article::with(['author:id,name', 'categories:id,name']);

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        if ($request->has('category') && $request->category !== '') {
            $query->whereHas('categories', function ($q) use ($request) {
                $q->where('id', $request->category);
            });
        }

        if ($request->has('date_from') && $request->date_from !== '') {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to !== '') {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->user()->role === 'author') {
            $query->where('user_id', $request->user()->id);
        }

        $articles = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $articles
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string|min:10',
            'status' => 'required|in:Draft,Published,Archived',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
        ]);

        $article = Article::create([
            'user_id' => Auth::id(),
            'title' => $validated['title'],
            'content' => $validated['content'],
            'status' => $validated['status'],
            'published_at' => $validated['status'] === 'Published' ? now() : null,
        ]);

        if (!empty($validated['category_ids'])) {
            $article->categories()->attach($validated['category_ids']);
        }

        GenerateArticleDetails::dispatch($article);

        Log::info("Article created with ID: {$article->id}, AI job dispatched");

        return response()->json([
            'success' => true,
            'data' => $article->load('categories'),
            'message' => 'Article created successfully'
        ], 201);
    }

    public function show(Article $article)
    {
        $this->authorize('update', $article);

        return response()->json([
            'success' => true,
            'data' => $article->load(['author:id,name', 'categories:id,name'])
        ]);
    }

    public function update(Request $request, Article $article)
    {
        $this->authorize('update', $article);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string|min:10',
            'status' => 'sometimes|required|in:Draft,Published,Archived',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:categories,id',
        ]);

        $article->update($validated);

        if ($request->has('category_ids')) {
            $article->categories()->sync($validated['category_ids'] ?? []);
        }

        if ($request->has('content') || $request->has('title')) {
            GenerateArticleDetails::dispatch($article);
            Log::info("Article updated with ID: {$article->id}, AI job dispatched");
        }

        return response()->json([
            'success' => true,
            'data' => $article->load('categories'),
            'message' => 'Article updated successfully'
        ]);
    }

    public function destroy(Article $article)
    {
        $this->authorize('delete', $article);
        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'Article deleted successfully'
        ]);
    }
}
