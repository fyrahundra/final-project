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
		padding: 0.75rem 1rem 2rem;
		overflow: auto;
		box-sizing: border-box;
		background:
			radial-gradient(circle at 12% 8%, rgba(255, 255, 255, 0.9) 0 9%, transparent 26%),
			linear-gradient(180deg, #eef3fb 0%, #edf0f5 40%, #e9edf2 100%);
	}
</style>
