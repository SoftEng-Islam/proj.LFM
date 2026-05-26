/**
 * Time conversion utilities for the LFM UI layer.
 *
 * Rust's `std::time::SystemTime` serialises via serde as:
 *   { secs_since_epoch: u64, nanos_since_epoch: u32 }
 */

export interface SystemTime {
	secs_since_epoch: number;
	nanos_since_epoch: number;
}

/** Convert a Rust `SystemTime` struct to a JavaScript `Date`. */
export function systemTimeToDate(st: SystemTime): Date {
	return new Date(st.secs_since_epoch * 1000 + Math.floor(st.nanos_since_epoch / 1_000_000));
}

/** Convert a Rust `SystemTime` struct to an ISO 8601 string. */
export function systemTimeToIso(st: SystemTime): string {
	return systemTimeToDate(st).toISOString();
}
