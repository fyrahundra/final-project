<div class="admin-layout">
	<slot></slot>
</div>

<style>
	.admin-layout {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		background-color: var(--secondary-background-color);
	}
</style>
