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

	/**
	 * @param {import('./slide.js').MadSlide} slide
	 */
	#getSlideSteps(slide) {
		const steps = [...slide.querySelectorAll('[data-animate-in], [data-animate-out], [data-animate-highlight]')];
		const currentStep = slide.querySelector('[data-current-step]') ?? undefined;

		return {
			steps,
			currentStep,

			isFirstStep: steps.at(0) === currentStep,
			isLastStep: steps.at(-1) === currentStep,

			isCurrentStepHighlight: currentStep?.getAttribute('data-current-step') === 'highlight',
			currentStepHasHighlight: currentStep?.hasAttribute('data-animate-highlight') ?? false
		};
	}

	/**
	 * @param {Element[]} steps
	 * @param {Element} step
	 */
	#getAdjacentStep(steps, step) {
		const index = steps.indexOf(step);

		if (index === -1) {
			return {};
		}

		return {
			// oxlint-disable-next-line no-magic-numbers
			secondPreviousStep: index > 1 ? steps.at(index - 2) : undefined,
			previousStep: index > 0 ? steps.at(index - 1) : undefined,

			nextStep: index < steps.length - 1 ? steps.at(index + 1) : undefined,
			// oxlint-disable-next-line no-magic-numbers
			secondNextStep: index < steps.length - 2 ? steps.at(index + 2) : undefined
		};
	}

	/**
	 * @param {import('./slide.js').MadSlide} currentSlide
	 */
	#getAdjacentSlides(currentSlide) {
		const slides = [...this.querySelectorAll('mad-slide')];
		const index = slides.indexOf(currentSlide);

		if (index === -1) {
			return {};
		}

		return {
			previousSlide: index > 0 ? slides.at(index - 1) : undefined,

			nextSlide: index < slides.length - 1 ? slides.at(index + 1) : undefined
		};
	}

	/**
	 * @param {import('./slide.js').MadSlide} slide
	 * @param {Element} [currentStep]
	 */
	#clearStepsAttributes(slide, currentStep) {
		slide.querySelector('[data-previous-step]')?.toggleAttribute('data-previous-step', false);
		slide.querySelector('[data-next-step]')?.toggleAttribute('data-next-step', false);

		currentStep?.toggleAttribute('data-current-step', false);
	}

	/**
	 * @param {Object} options
	 * @param {'true' | 'false'} [options.previous]
	 * @param {'true' | 'false'} [options.next]
	 */
	#setButtonDisabledState({ previous, next }) {
		if (previous) {
			this.shadowRoot.querySelector('button[command="--next-part"]')?.setAttribute('aria-disabled', previous);
		}

		if (next) {
			this.shadowRoot.querySelector('button[command="--previous-part"]')?.setAttribute('aria-disabled', next);
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
		this.#setButtonDisabledState({ previous: 'false', next: 'false' });

		const { currentStep, steps, currentStepHasHighlight, isCurrentStepHighlight, isFirstStep } = this.#getSlideSteps(currentSlide);

		// If current step has highlight, go back on the highlight
		if (currentStepHasHighlight && isCurrentStepHighlight) {
			currentStep?.setAttribute('data-current-step', '');
			return;
		}

		// If there is no steps, or it is the first step, go to the previous slide
		if (!currentStep || isFirstStep) {
			this.#clearStepsAttributes(currentSlide, currentStep);

			const { previousSlide } = this.#getAdjacentSlides(currentSlide);
			if (previousSlide) {
				currentSlide.removeAttribute('aria-current');
				previousSlide.setAttribute('aria-current', 'step');

				const { steps: previousSlideSteps } = this.#getSlideSteps(previousSlide);
				const previousSlideCurrentStep = previousSlideSteps.at(-1);

				if (previousSlideCurrentStep) {
					const { previousStep: previousSlidePreviousStep } = this.#getAdjacentStep(previousSlideSteps, previousSlideCurrentStep);

					this.#clearStepsAttributes(previousSlide);
					previousSlidePreviousStep?.toggleAttribute('data-previous-step', true);
					previousSlideCurrentStep.toggleAttribute('data-current-step', true);

					// Apply highlight, if it exists
					if (previousSlideCurrentStep.hasAttribute('data-animate-highlight')) {
						previousSlideCurrentStep.setAttribute('data-current-step', 'highlight');
					}
				}
			} else {
				// TODO: review this logic. Should this be here or in another place?
				this.#setButtonDisabledState({ previous: 'true' });
			}

			return;
		}

		// Update the previous/current steps
		const { previousStep, secondPreviousStep } = this.#getAdjacentStep(steps, currentStep);

		this.#clearStepsAttributes(currentSlide);
		secondPreviousStep?.toggleAttribute('data-previous-step', true);
		previousStep?.toggleAttribute('data-current-step', true);
		currentStep.toggleAttribute('data-next-step', true);
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
		this.#setButtonDisabledState({ previous: 'false', next: 'false' });

		const { currentStep, steps, currentStepHasHighlight, isCurrentStepHighlight, isLastStep } = this.#getSlideSteps(currentSlide);

		// If current step has highlight, but hasen't run yet, run the highlight
		if (currentStepHasHighlight && !isCurrentStepHighlight) {
			currentStep?.setAttribute('data-current-step', 'highlight');
			return;
		}

		// If there is no steps, or it is the last step, go to the next slide
		if (!currentStep || isLastStep) {
			this.#clearStepsAttributes(currentSlide, currentStep);

			const { nextSlide } = this.#getAdjacentSlides(currentSlide);
			if (nextSlide) {
				currentSlide.removeAttribute('aria-current');
				nextSlide.setAttribute('aria-current', 'step');
			} else {
				// TODO: review this logic. Should this be here or in another place?
				this.#setButtonDisabledState({ next: 'true' });
			}

			return;
		}

		// Update the previous/current steps
		const { nextStep, secondNextStep } = this.#getAdjacentStep(steps, currentStep);

		this.#clearStepsAttributes(currentSlide);
		currentStep.toggleAttribute('data-previous-step', true);
		nextStep?.toggleAttribute('data-current-step', true);
		secondNextStep?.toggleAttribute('data-next-step', true);
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
