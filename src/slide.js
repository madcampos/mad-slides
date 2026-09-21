/**
 * @typedef {'title' | 'content' | 'section-header' | 'two-content' | 'comparison' | 'title-only' | 'blank' | 'content-caption' | 'custom' } Layout
 */

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
 *
 * @implements {CustomElement}
 */
export class MadSlide extends HTMLElement {
	static observedAttributes = ['layout', 'show-number', 'stylesheet'];

	/** @type {Record<string, string>} */
	static #layouts = {
		'title': /* html */ `
			<header part="header">
				<hgroup>
					<slot name="title"></slot>
					<p part="subtitle"><slot name="subtitle"></slot></p>
				</hgroup>
			</header>
		`,
		'content': /* html */ `
			<header part="header">
				<slot name="title"></slot>
			</header>

			<slide-content part="content">
				<slot></slot>
			</slide-content>
		`,
		'section-header': /* html */ `
			<header part="header">
				<slot name="title"></slot>
			</header>

			<slide-content part="content">
				<slot></slot>
			</slide-content>
		`,
		'two-content': /* html */ `
			<header part="header">
				<slot name="title"></slot>
			</header>

			<slide-content part="content">
				<slot name="content-a"></slot>
			</slide-content>

			<slide-content part="content">
				<slot name="content-b"></slot>
			</slide-content>
		`,
		'comparison': /* html */ `
			<header part="header">
				<slot name="title"></slot>
			</header>

			<slide-caption part="caption">
				<slot name="content-a-caption"></slot>
			</slide-caption>
			<slide-content part="content">
				<slot name="content-a"></slot>
			</slide-content>

			<slide-caption part="caption">
				<slot name="content-b-caption"></slot>
			</slide-caption>
			<slide-content part="content">
				<slot name="content-b"></slot>
			</slide-content>
		`,
		'title-only': /* html */ `
			<header part="header">
				<slot name="title"></slot>
			</header>
		`,
		'blank': /* html */ ``,
		'content-caption': /* html */ `
			<header part="header">
				<slot name="title"></slot>
			</header>

			<slide-caption part="caption">
				<slot name="caption"></slot>
			</slide-caption>

			<slide-content part="content">
				<slot></slot>
			</slide-content>
		`,
		'custom': /* html */ `
			<slide-content part="content">
				<slot></slot>
			</slide-content>
		`
	};

	/**
	 * An extra constructed stylesheet, it provides a place to add custom styles that are applied directly to the component.
	 *
	 * Potential use cases are for adding new layouts or `@import`ing external stylesheets.
	 */
	static stylesheet = new CSSStyleSheet();

	/**
	 * Add a new layout to the list of available layouts.
	 * It should inslude the internal HTML for the component with the required slots.
	 *
	 * @param {string} name
	 * @param {string} html
	 */
	static addLayout(name, html) {
		MadSlide.#layouts[name] ??= html;

		document.querySelectorAll('mad-slide').forEach((slide) => {
			slide.render();
		});
	}

	/**
	 * Removes an existing layout from the list of available layouts.
	 *
	 * @param {string} name
	 */
	static removeLayout(name) {
		// oxlint-disable-next-line typescript/no-dynamic-delete
		delete MadSlide.#layouts[name];

		document.querySelectorAll('mad-slide').forEach((slide) => {
			slide.render();
		});
	}

	/** @type {ElementInternals} */
	#internals;

	#number = -1;

	constructor() {
		super();

		this.shadowRoot = this.attachShadow({ mode: 'open' });
		this.#internals = this.attachInternals();

		const children = [...this.closest('mad-slide-container')?.children ?? []];
		const index = children.indexOf(this);
		this.#number = index;

		if (!this.id) {
			if (index === -1) {
				this.id = `slide-${crypto.randomUUID()}`;
			} else {
				this.id = `slide-${index}`;
			}
		}

		this.#internals.role = 'group';
		this.#internals.ariaRoleDescription = 'slide';

		if (!this.ariaLabel && !this.getAttribute('aria-labelledby') && !this.title) {
			const titleElement = this.querySelector('[slot="title"]');

			if (titleElement) {
				titleElement.id ||= crypto.randomUUID();
				this.setAttribute('aria-labelledby', titleElement.id);
			} else {
				this.#internals.ariaLabel = this.#number.toString();
			}
		}

		const stylesheet = new CSSStyleSheet();
		const slideStylesheetUrl = new URL('./slide.css', import.meta.url);

		stylesheet.replaceSync(`@import url("${slideStylesheetUrl.href}");`);

		this.shadowRoot.adoptedStyleSheets = [stylesheet, MadSlide.stylesheet];
	}

	/**
	 * The slide layout.
	 *
	 * @param {string | null} newValue
	 */
	set layout(newValue) {
		if (!newValue) {
			this.removeAttribute('layout');
			return;
		}

		this.render();

		this.setAttribute('layout', newValue);
	}

	get layout() {
		return this.getAttribute('layout');
	}

	/**
	 * If the slide number should be shown on the footer.
	 *
	 * @param {boolean | null} newValue
	 */
	set showNumber(newValue) {
		this.toggleAttribute('show-number', newValue === true);
	}

	get showNumber() {
		return this.hasAttribute('show-number');
	}

	/** The slide number. */
	get number() {
		return this.#number;
	}

	render() {
		const layout = MadSlide.#layouts[this.layout ?? 'custom'] ?? MadSlide.#layouts['custom'] ?? '';

		this.shadowRoot.innerHTML = /* html */ `
			${layout}

			<footer part="footer">
				<span><slot name="footer"></slot></span>
				<slide-number></slide-number>
			</footer>
		`;
	}

	connectedCallback() {
		this.render();
	}

	/**
	 * @param {string} name
	 * @param {string | null} oldValue
	 * @param {string | null} newValue
	 */
	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) {
			return;
		}

		switch (name) {
			case 'layout':
				this.layout = newValue;
				break;
			case 'show-number':
				this.showNumber = newValue !== null;
				break;
			case 'stylesheet':
				this.stylesheet = newValue;
				break;
			default:
				break;
		}
	}
}

if (!customElements.get('mad-slide')) {
	customElements.define('mad-slide', MadSlide);
}
