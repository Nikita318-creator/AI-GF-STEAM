export class AIError extends Error {
    constructor(code, message, cause) {
        super(message ?? AIError.defaultMessage(code));
        this.code = code;
        this.cause = cause;
        this.name = 'AIError';
    }
    static defaultMessage(code) {
        switch (code) {
            case 'invalidURL':
                return 'Invalid proxy URL.';
            case 'networkError':
                return 'Network error.';
            case 'apiError':
                return 'API Error (Proxy).';
            case 'decodingError':
                return 'Failed to parse response.';
            case 'emptyResponse':
                return 'The proxy returned an empty or invalid response.';
            case 'rateLimitExceeded':
                return 'Rate limit exceeded';
        }
    }
}
