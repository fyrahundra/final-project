<main>
	<slot></slot>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		width: 100%;
		min-height: 100vh;
		overflow: auto;
		box-sizing: border-box;
		background: var(--background-color, #f0f0f0);
	}

	@media (max-width: 900px) {
		main {
			align-items: stretch;
		}
	}
</style>
