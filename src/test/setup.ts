import "@testing-library/jest-dom/vitest";

// React Flow needs to measure DOM nodes to render itself. jsdom doesn't
// implement ResizeObserver/DOMMatrixReadOnly or real element sizing, so we
// apply the shim from React Flow's official testing guide:
// https://reactflow.dev/learn/advanced-use/testing
class ResizeObserverPolyfill {
  callback: ResizeObserverCallback;
  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    const timer = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const entry = { target, contentRect: rect } as ResizeObserverEntry;
      this.callback([entry], this);
    }, 0);
    this.timers.add(timer);
  }

  unobserve() {}

  disconnect() {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
  }
}

class DOMMatrixReadOnlyPolyfill {
  m22: number;

  constructor(transform: string) {
    const scale = transform?.match(/scale\(([1-9.])\)/)?.[1];
    this.m22 = scale !== undefined ? +scale : 1;
  }
}

globalThis.ResizeObserver = ResizeObserverPolyfill as unknown as typeof ResizeObserver;
globalThis.DOMMatrixReadOnly = DOMMatrixReadOnlyPolyfill as unknown as typeof DOMMatrixReadOnly;

Object.defineProperties(globalThis.HTMLElement.prototype, {
  offsetHeight: {
    get() {
      return Number.parseFloat(this.style.height as string) || 1;
    },
  },
  offsetWidth: {
    get() {
      return Number.parseFloat(this.style.width as string) || 1;
    },
  },
});

(globalThis.SVGElement.prototype as unknown as { getBBox: () => object }).getBBox = () => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});
