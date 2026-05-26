import type { Directive } from 'vue';
import tippy, { type Instance, type Props } from 'tippy.js';

type TooltipValue = string | Partial<Props>;
type TooltipElement = HTMLElement & { __lfmTippy?: Instance<Props> };

function createOptions(value: TooltipValue): Partial<Props> {
	if (typeof value === 'string') {
		return { content: value };
	}

	return value;
}

function mountTooltip(el: TooltipElement, value: TooltipValue) {
	el.__lfmTippy?.destroy();
	el.__lfmTippy = tippy(el, {
		theme: 'lfm',
		placement: 'top',
		delay: [120, 80],
		...createOptions(value)
	});
}

export const tooltipDirective: Directive<TooltipElement, TooltipValue> = {
	mounted(el, binding) {
		mountTooltip(el, binding.value);
	},
	updated(el, binding) {
		if (binding.value !== binding.oldValue) {
			mountTooltip(el, binding.value);
		}
	},
	unmounted(el) {
		el.__lfmTippy?.destroy();
		delete el.__lfmTippy;
	}
};
