// Inside app/Http/Kernel.php

'api' => [
// \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, // We are removing this
'throttle:api',
\Illuminate\Routing\Middleware\SubstituteBindings::class,
],