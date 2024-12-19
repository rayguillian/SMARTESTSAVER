class ScriptLoader {
  static loadedScripts = new Set();

  static loadScript(src, options = {}) {
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async ?? true;
      script.defer = options.defer ?? true;

      if (options.callback) {
        window[options.callback] = () => {
          this.loadedScripts.add(src);
          resolve();
        };
      }

      script.onload = () => {
        if (!options.callback) {
          this.loadedScripts.add(src);
          resolve();
        }
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  static unloadScript(src) {
    this.loadedScripts.delete(src);
    const script = document.querySelector(`script[src="${src}"]`);
    if (script) {
      script.remove();
    }
  }
}

export default ScriptLoader;
