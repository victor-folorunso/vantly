<script lang="ts">
	import { barPosition } from '#lib/notation.ts';

	interface Props {
		/** The tune in ABC notation (see notation.ts). */
		abc: string;
		/** The bar being played, lit like the current syllable; -1 for none. */
		currentBar?: number;
		/** Jump to a bar when it is clicked. */
		onbar?: (bar: number) => void;
	}

	let { abc, currentBar = -1, onbar }: Props = $props();
	let target = $state<HTMLDivElement>();
	let failed = $state(false);

	// abcjs is about 120 kB gzipped, so it only loads for people who open staff notation.
	$effect(() => {
		const code = abc;
		if (!target) return;
		import('abcjs')
			.then(({ default: abcjs }) => {
				if (!target) return;
				abcjs.renderAbc(target, code, {
					add_classes: true,
					responsive: 'resize',
					foregroundColor: 'currentColor',
					paddingtop: 0,
					paddingbottom: 0,
					paddingleft: 0,
					paddingright: 0,
					clickListener: (element) => {
						const classes = [...(element.abselem?.elemset?.[0]?.classList ?? [])];
						const line = Number(classes.find((c) => /^abcjs-l\d+$/.test(c))?.slice(7));
						const measure = Number(classes.find((c) => /^abcjs-m\d+$/.test(c))?.slice(7));
						if (Number.isFinite(line) && Number.isFinite(measure)) onbar?.(line * 4 + measure);
					}
				});
				failed = false;
			})
			.catch(() => (failed = true));
	});

	// Light the current bar's notes.
	$effect(() => {
		if (!target) return;
		void abc;
		target.querySelectorAll('.now-bar').forEach((el) => el.classList.remove('now-bar'));
		if (currentBar < 0) return;
		const { line, measure } = barPosition(currentBar);
		target
			.querySelectorAll(`.abcjs-note.abcjs-l${line}.abcjs-m${measure}, .abcjs-rest.abcjs-l${line}.abcjs-m${measure}`)
			.forEach((el) => el.classList.add('now-bar'));
	});
</script>

{#if failed}
	<p class="failed">The staff could not be drawn. The downloads below still work.</p>
{/if}
<div class="staff" bind:this={target} aria-label="The melody in staff notation"></div>

<style>
	.staff {
		color: var(--ink);
		margin: var(--space-3) 0;
	}

	.staff :global(svg) {
		max-width: 100%;
	}

	/* Lamp yellow is too light for note heads on paper; this is its darker shade. */
	.staff :global(.now-bar),
	.staff :global(.now-bar path) {
		fill: #c98a00;
	}

	@media print {
		.staff :global(.now-bar),
		.staff :global(.now-bar path) {
			fill: currentColor;
		}
	}

	.failed {
		color: var(--danger);
	}
</style>
