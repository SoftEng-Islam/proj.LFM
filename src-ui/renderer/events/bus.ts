// Minimal event bus for renderer (no external deps)
type Handler<T = any> = (payload: T) => void;

const listeners = new Map<string, Set<Handler<any>>>();

export function on<T = any>(event: string, handler: Handler<T>): () => void {
	if (!listeners.has(event)) listeners.set(event, new Set());
	listeners.get(event)!.add(handler as Handler<any>);
	return () => off(event, handler);
}

export function off<T = any>(event: string, handler?: Handler<T>): void {
	if (!listeners.has(event)) return;
	if (!handler) {
		listeners.delete(event);
		return;
	}
	listeners.get(event)!.delete(handler as Handler<any>);
	if (listeners.get(event)!.size === 0) listeners.delete(event);
}

export function emit<T = any>(event: string, payload?: T): void {
	const set = listeners.get(event);
	if (!set) return;
	for (const h of Array.from(set)) {
		try {
			h(payload as T);
		} catch (e) {
			// swallow errors to avoid breaking other listeners
			// consumers can log if needed
			 
			console.error('[bus] handler error for', event, e);
		}
	}
}

export function clearBus(): void {
	listeners.clear();
}

export default { on, off, emit, clearBus };
