class RequestQueue {
  constructor(options = {}) {
    this.queue = [];
    this.processing = false;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.maxDelay = options.maxDelay || 120000;
    this.timeout = options.timeout || 120000;      // Increased to 120 seconds
    this.maxQueueSize = options.maxQueueSize || 1000;
    this.deadLetterQueue = [];
  }

  async enqueue(request, priority = 0) {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Queue capacity exceeded');
    }

    return new Promise((resolve, reject) => {
      const queueItem = {
        request,
        priority,
        resolve,
        reject,
        retries: 0,
        addedAt: Date.now(),
        timeout: setTimeout(() => {
          this.handleTimeout(queueItem);
        }, this.timeout)
      };

      const index = this.queue.findIndex(item => item.priority < priority);
      if (index === -1) {
        this.queue.push(queueItem);
      } else {
        this.queue.splice(index, 0, queueItem);
      }

      this.processQueue();
    });
  }

  handleTimeout(item) {
    const index = this.queue.indexOf(item);
    if (index !== -1) {
      this.queue.splice(index, 1);
      item.reject(new Error('Request timeout'));
      this.deadLetterQueue.push({
        request: item.request,
        error: 'Timeout',
        timestamp: Date.now()
      });
    }
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const item = this.queue[0];
    
    try {
      const result = await this.executeRequest(item);
      clearTimeout(item.timeout);
      item.resolve(result);
      this.queue.shift();
    } catch (error) {
      const shouldRetry = await this.handleError(item, error);
      
      if (!shouldRetry) {
        clearTimeout(item.timeout);
        item.reject(error);
        this.queue.shift();
        this.deadLetterQueue.push({
          request: item.request,
          error: error.message,
          timestamp: Date.now()
        });
      }
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 0);
      }
    }
  }

  async executeRequest(item) {
    try {
      return await item.request();
    } catch (error) {
      if (error.response?.status === 429) {
        throw new RateLimitError('Rate limit exceeded');
      }
      throw error;
    }
  }

  async handleError(item, error) {
    if (item.retries >= this.maxRetries) {
      return false;
    }

    const delay = Math.min(
      this.maxDelay,
      this.retryDelay * Math.pow(2, item.retries)
    );

    item.retries++;
    await new Promise(resolve => setTimeout(resolve, delay));
    return true;
  }

  getQueueStats() {
    return {
      queueLength: this.queue.length,
      deadLetterQueueLength: this.deadLetterQueue.length,
      processing: this.processing,
      oldestRequest: this.queue[0]?.addedAt
    };
  }

  clearDeadLetterQueue() {
    this.deadLetterQueue = [];
  }

  clearQueue() {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.processing = false;
  }
}

// Create singleton instance
const requestQueue = new RequestQueue({
  maxRetries: 5,
  retryDelay: 2000,
  maxDelay: 120000,    // 2 minutes maximum delay
  timeout: 120000,      // 120 seconds timeout
  maxQueueSize: 1000
});

// Export the singleton instance
export { requestQueue };
