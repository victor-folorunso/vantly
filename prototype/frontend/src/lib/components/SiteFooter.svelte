<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_PAGES } from '#lib/site.ts';

	const guides = PUBLIC_PAGES.filter((p) => p.path !== '/');

	// Put together in the browser so the address is not in the prerendered HTML that scrapers read.
	const CONTACT = ['wizardking.reborn', 'gmail.com'];
	let email = $state('');
	onMount(() => (email = CONTACT.join('@')));
	const mailto = $derived(`mailto:${email}?subject=${encodeURIComponent('SolfaFlow suggestion')}`);
</script>

<footer class="no-print">
	<div class="wrap grid">
		<div>
			<p class="name">SolfaFlow</p>
			<p class="note">
				Free. Transcription is automatic, so some notes will be wrong. Check by ear and change the key
				if it sounds off.
			</p>
		</div>
		<nav aria-label="Guides">
			<p class="heading">Guides</p>
			<ul>
				{#each guides as guide (guide.path)}
					<li><a href={guide.path}>{guide.title}</a></li>
				{/each}
			</ul>
		</nav>
		<section aria-labelledby="contact-heading">
			<p class="heading" id="contact-heading">Suggestions</p>
			<p class="note">
				A wrong note, a song that did not work, or an idea? Tell us and it helps make SolfaFlow better.
			</p>
			{#if email}
				<p><a href={mailto}>{email}</a></p>
			{:else}
				<p>{CONTACT[0]} at {CONTACT[1].replace('.', ' dot ')}</p>
			{/if}
		</section>
	</div>
</footer>

<style>
	footer {
		margin-top: var(--space-8);
		padding: var(--space-7) 0 var(--space-6);
		border-top: 1px solid var(--rule);
		color: var(--slate);
		font-size: var(--step--1);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: var(--space-6);
	}

	.name,
	.heading {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: var(--step-0);
		color: var(--ink);
		margin-bottom: var(--space-2);
	}

	.note {
		max-width: 36ch;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: var(--space-2);
	}
</style>
