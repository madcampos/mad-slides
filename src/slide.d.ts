export type Layout = 'title' | 'content' | 'section-header' | 'two-content' | 'comparison' | 'title-only' | 'blank' | 'content-caption' | 'custom';

/**
 * The slide element, it holds layout information and content for the slide.
 *
 * The default layouts are defined in the {@link Layout} type. Those are some of the default layouts on PowerPoint.
 * Layouts can be added or removed using the static methods {@link MadSlide.addLayout} and {@link MadSlide.removeLayout}.
 *
 * When the slide is created, it will find it's index within the parent {@link MadSlideContainer} and use that to set the slide `id`, if there is no `id` already set.
 * The slide `id` is used in the URL to save the current state of the presentation.
 *
 * @element mad-slide
 *
 * @attribute {string} layout - The slide layout.
 * @attribute {boolean} show-number - If the slide number will be shown on the footer.
 *
 * @slot footer - Every slide includes a footer, this is where the footer content goes.
 * @slot title - For layouts with titles, this is the title of the slide.
 * @slot subtitle - For layouts with a title and a subtitle, this is the subtitle of the slide.
 * @slot content-a - For comparison layouts, this is one side of the comparison.
 * @slot content-b - For comparison layouts this is the other side of the comparison.
 * @slot content-a-caption - For comparison slides with caption, this is the caption for one of the side.
 * @slot content-b-caption - For comparison slides with caption, this is the caption for the other side.
 * @slot caption - For slies with contents and a caption, this is the caption.
 * @slot - The default slot represents the content for the slide.
 *
 * @csspart footer - The slide footer.
 * @csspart title - For layouts with titles, container for the title slot.
 * @csspart subtitle - For layouts with a title and a subtitle, the container for the subtitle slot.
 * @csspart content - For layouts with content, this is the container for the content.
 * @csspart caption - For layouts with captions, this is the container for the caption.
 */
export declare class MadSlide extends HTMLElement implements CustomElement {
	static observedAttributes: string[];

	/**
	 * An extra constructed stylesheet, it provides a place to add custom styles that are applied directly to the component.
	 *
	 * Potential use cases are for adding new layouts or `@import`ing external stylesheets.
	 */
	static stylesheet: CSSStyleSheet;

	/**
	 * Add a new layout to the list of available layouts.
	 * It should inslude the internal HTML for the component with the required slots.
	 */
	static addLayout(name: string, html: string): void;

	/**
	 * Removes an existing layout from the list of available layouts.
	 */
	static removeLayout(name: string): void;

	constructor();

	/** The slide layout. */
	set layout(newValue: string | null);
	get layout(): string | null;

	/** If the slide number should be shown on the footer. */
	set showNumber(newValue: boolean);
	get showNumber(): boolean;

	/** The slide number. */
	get number(): number;

	render(): void;

	connectedCallback(): void;

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
}
