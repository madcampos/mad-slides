/**
 * A container for slides. It incldues the navigation buttons for the presentation.
 *
 * When the container is created it will use the `slide` search parameter on the URL as the value for the selected slide. If the parameter is not set, it will use the first slide instead.
 *
 * @element mad-slide-container
 *
 * @attribute {string} presentation-title - The presentation title.
 *
 * @slot - The default slot is for all slides.
 *
 * @csspart controls - The presentation controls container.
 * @csspart button - One of the presentation control button.
 * @csspart button-icon - The SVG icon inside one of the presentation control buttons.
 * @csspart slide-count - The slide count container.
 */
export declare class MadSlideContainer extends HTMLElement implements CustomElement {
	static observedAttributes: string[];
	constructor();

	/** The presentation title. */
	set presentationTitle(newValue: string | null);
	get presentationTitle(): string | null;

	handleEvent(evt: Event): void;

	connectedCallback(): void;

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
}
