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
 *
 * @implements {CustomElement}
 */
export class MadSlideContainer extends HTMLElement {
	static observedAttributes = ['presetnation-title'];

	/** @type {ElementInternals} */
	#internals;

	constructor() {
		super();

		this.shadowRoot = this.attachShadow({ mode: 'open' });
		this.#internals = this.attachInternals();

		this.#internals.role = 'region';
		this.#internals.ariaRoleDescription = 'presentation';

		if (!this.ariaLabel && !this.getAttribute('aria-labelledby') && !this.title) {
			if (this.getAttribute('presentation-title')) {
				this.#internals.ariaLabel = this.getAttribute('presentation-title');
			} else {
				const titleElement = this.querySelector('h1, mad-slide[layout="title"] [slot="title"]');

				if (titleElement) {
					titleElement.id ||= crypto.randomUUID();
					this.setAttribute('aria-labelledby', titleElement.id);
				}
			}
		}

		this.querySelectorAll('mad-slide').forEach((slide) => {
			slide.removeAttribute('aria-current');
		});

		const slideId = new URLSearchParams(window.location.search).get('slide');
		const selectedSlide = this.querySelector(`#${slideId}`) ?? this.querySelector('mad-slide');

		selectedSlide?.setAttribute('aria-current', 'step');

		const stylesheet = new CSSStyleSheet();
		const slideStylesheetUrl = new URL('./slide-container.css', import.meta.url);

		stylesheet.replaceSync(`@import url("${slideStylesheetUrl.href}");`);

		this.shadowRoot.adoptedStyleSheets = [stylesheet];
	}

	/**
	 * The presentation title.
	 *
	 * @param {string | null} newValue
	 */
	set presentationTitle(newValue) {
		this.#internals.ariaLabel = newValue;

		if (!newValue) {
			this.removeAttribute('presentation-title');
			return;
		}

		this.setAttribute('presentation-title', newValue);
	}

	get presentationTitle() {
		return this.getAttribute('presentation-title');
	}

	/** @param {MouseEvent} evt */
	#handleClick(evt) {
		if (!(evt.target instanceof HTMLElement) || !evt.target.matches('button')) {
			return;
		}

		if (evt.target.command === '--next-part') {
			this.#nextPart();
		}

		if (evt.target.command === '--previous-part') {
			this.#previousPart();
		}
	}

	/** @param {KeyboardEvent} evt */
	#handleKeyPress(evt) {
		if (!(evt.target instanceof HTMLElement) || evt.target.matches('input, select, textarea, button, audio, video') || evt.target.contentEditable) {
			return;
		}

		if (evt.key === 'ArrowRight') {
			this.#nextPart();
		}

		if (evt.key === 'ArrowLeft') {
			this.#previousPart();
		}
	}

	#previousPart() {
		const currentSlide = this.querySelector('mad-slide[aria-current="step"]');
		if (!currentSlide) {
			return;
		}

		// If button is disabled ignore
		if (this.shadowRoot.querySelector('button[command="--previous-part"][aria-disabled="true"]')) {
			return;
		}

		// Reset buttons state
		this.shadowRoot.querySelector('button[command="--next-part"]')?.setAttribute('aria-disabled', 'false');
		this.shadowRoot.querySelector('button[command="--previous-part"]')?.setAttribute('aria-disabled', 'false');

		const currentStep = currentSlide.querySelector('[data-current-step]');

		// If current step has highlight, go back on the highlight
		if (currentStep?.getAttribute('data-animate-highlight') && currentStep.getAttribute('data-current-step') === 'highlight') {
			currentStep.setAttribute('data-current-step', '');
			return;
		}

		const steps = [...currentSlide.querySelectorAll('[data-animate-in], [data-animate-out], [data-animate-highlight]')];

		// If there is no steps, or it is the first step, go to the previous slide
		if (!currentStep || steps.at(0) === currentStep) {
			currentStep?.toggleAttribute('data-current-step', false);

			const previousSlide = currentSlide.previousElementSibling;
			if (previousSlide) {
				currentSlide.removeAttribute('aria-current');
				previousSlide.setAttribute('aria-current', 'step');

				previousSlide.querySelector(':is([data-animate-in], [data-animate-out], [data-animate-highlight]):nth-last-of-type(2)')?.toggleAttribute(
					'data-previous-step',
					true
				);
				previousSlide.querySelector(':is([data-animate-in], [data-animate-out], [data-animate-highlight]):nth-last-of-type(1)')?.toggleAttribute('data-current-step', true);
			} else {
				this.shadowRoot.querySelector('button[command="--previous-part"]')?.setAttribute('aria-disabled', 'true');
			}

			return;
		}

		const previousStep = this.querySelector('[data-previous-step]');

		// Find the previous step and update the previous/current steps
		let previousStepIndex = Infinity;
		for (const [index, step] of steps.entries()) {
			if (step === previousStep) {
				previousStepIndex = index;
			}

			if (previousStepIndex - 1 !== index) {
				continue;
			}

			previousStep?.toggleAttribute('data-previous-step', false);
			previousStep?.toggleAttribute('data-current-step', true);

			currentStep.toggleAttribute('data-current-step', false);

			step.toggleAttribute('data-previous-step', true);
		}
	}

	#nextPart() {
		const currentSlide = this.querySelector('mad-slide[aria-current="step"]');
		if (!currentSlide) {
			return;
		}

		// If button is disable ignore
		if (this.shadowRoot.querySelector('button[command="--next-part"][aria-disabled="true"]')) {
			return;
		}

		// Reset buttons state
		this.shadowRoot.querySelector('button[command="--next-part"]')?.setAttribute('aria-disabled', 'false');
		this.shadowRoot.querySelector('button[command="--previous-part"]')?.setAttribute('aria-disabled', 'false');

		const currentStep = currentSlide.querySelector('[data-current-step]');

		// If current step has highlight, run the highlight
		if (currentStep?.getAttribute('data-animate-highlight') && currentStep.getAttribute('data-current-step') !== 'highlight') {
			currentStep.setAttribute('data-current-step', 'highlight');
			return;
		}

		const steps = [...currentSlide.querySelectorAll('[data-animate-in], [data-animate-out], [data-animate-highlight]')];

		// If there is no steps, or it is the last step, go to the next slide
		if (!currentStep || steps.at(-1) === currentStep) {
			this.querySelector('[data-previous-step]')?.toggleAttribute('data-previous-step', false);
			currentStep?.toggleAttribute('data-current-step', false);

			const nextSlide = currentSlide.nextElementSibling;
			if (nextSlide) {
				currentSlide.removeAttribute('aria-current');
				nextSlide.setAttribute('aria-current', 'step');
			} else {
				this.shadowRoot.querySelector('button[command="--next-part"]')?.setAttribute('aria-disabled', 'true');
			}

			return;
		}

		// Find the next step and update the previous/current steps
		let currentStepIndex = -Infinity;
		for (const [index, step] of steps.entries()) {
			if (step === currentStep) {
				currentStepIndex = index;
			}

			if (currentStepIndex + 1 > index) {
				break;
			}

			this.querySelector('[data-previous-step]')?.toggleAttribute('data-previous-step', false);

			currentStep.toggleAttribute('data-current-step', false);
			currentStep.toggleAttribute('data-previous-step', true);

			step.toggleAttribute('data-current-step', true);
		}
	}

	/** @param {Event} evt */
	handleEvent(evt) {
		if (evt instanceof MouseEvent) {
			this.#handleClick(evt);
		} else if (evt instanceof KeyboardEvent) {
			this.#handleKeyPress(evt);
		}
	}

	connectedCallback() {
		this.shadowRoot.innerHTML = /* html */ `
			<nav aria-label="Presentation controls" part="controls">
				<aside part="slide-count">
					<sr-only>Slide</sr-only>
					<span></span>
					<span>of</span>
					<span></span>
				</aside>

				<hr />

				<button
					type="button"
					part="button"
					command="--previous-part"
				>
					<sr-only>Previous slide/part</sr-only>
				</button>

				<button
					type="button"
					part="button"
					command="--next-part"
				>
					<sr-only>Next slide/part</sr-only>
				</button>
			</nav>

			<div>
				<slot></slot>
			</div>
		`;

		this.shadowRoot.querySelector('nav')?.addEventListener('click', this);
		window.addEventListener('keypress', this);
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
			case 'presentation-title':
				this.presentationTitle = newValue;
				break;
			default:
				break;
		}
	}
}

if (!customElements.get('mad-slide-container')) {
	customElements.define('mad-slide-container', MadSlideContainer);
}
