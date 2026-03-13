<div class="pub-layout">
	<div class="topbar">
		<h1>Coursley</h1>
	</div>
	<slot></slot>
</div>

<style>
	.pub-layout {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		background-color: var(--secondary-background-color);
	}

	.topbar {
		width: 100%;
		padding: 1rem;
		background-color: #333333;
		color: #ffffff;
		text-align: center;
	}
</style>
