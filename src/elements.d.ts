import type { MadSlideContainer } from './slide-container.js';
import type { MadSlide } from './slide.js';

declare global {
	interface HTMLElementTagNameMap {
		'mad-slide': MadSlide;
		'mad-slide-container': MadSlideContainer;
	}
}
