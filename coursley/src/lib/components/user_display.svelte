<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	export let user;
	export let onProfilePictureUpdated: ((profilePicture: string) => void) | undefined = undefined;

	let isOpen = false;
	let isUploading = false;

	function dropdown() {
		isOpen = !isOpen;
	}

	function clickOutside(node: HTMLElement) {
		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Node | null;
			if (target && !node.contains(target)) {
				isOpen = false;
			}
		};

		document.addEventListener('pointerdown', handlePointerDown, true);

		return {
			destroy() {
				document.removeEventListener('pointerdown', handlePointerDown, true);
			}
		};
	}

	function changeProfilePic() {
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'image/*';
		fileInput.onchange = async () => {
			const file = fileInput.files?.[0];
			if (file) {
				const formData = new FormData();
				formData.append('picture', file);
				isUploading = true;
				try {
					const response = await fetch('/api/profile_picture', {
						method: 'POST',
						body: formData
					});

					const payload = await response.json();
					if (!response.ok || !payload?.profilePicture) {
						throw new Error(payload?.message ?? 'Failed to upload profile picture.');
					}

					onProfilePictureUpdated?.(payload.profilePicture as string);
				} catch (error) {
					console.error('Profile picture upload failed:', error);
					alert('Failed to upload profile picture.');
				} finally {
					isUploading = false;
				}
			}
		};
		fileInput.click();
	}
</script>

<div class="user-display" use:clickOutside>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="profile-picture" id="thumbnail" class:show={isOpen} onclick={dropdown}>
		{#if user.profilePicture}
			<img src={user.profilePicture} alt="" />
		{:else}
			<div class="placeholder">
				<p>{user.name.charAt(0).toUpperCase()}</p>
			</div>
		{/if}
	</div>

	{#if isOpen}
		<div class="dropdown-menu">
			<p>{user.email}</p>
			<div style="position: relative;">
				<div class="profile-picture" style="width: 120px; height: 120px;">
					{#if user.profilePicture}
						<img src={user.profilePicture} alt="" />
					{:else}
						<div class="placeholder" style="font-size: 3rem; color: #ffffff;">
							<p>{user.name.charAt(0).toUpperCase()}</p>
						</div>
					{/if}
				</div>
				<button class="change-picture" onclick={() => changeProfilePic()} disabled={isUploading}>
					{isUploading ? '...' : '🔄'}
				</button>
			</div>
			<h2>Hej <strong>{user.name}</strong>!</h2>
			{#if user.isAdmin}
				<button
					type="button"
					onclick={() => {
						goto('/dashboard');
					}}
				>
					Admin Panel
				</button>
			{/if}
			<form action="/api/theme" method="POST" use:enhance>
				<button type="submit" name="theme" value={user.theme === 'light' ? 'dark' : 'light'}>
					Switch to {user.theme === 'light' ? 'Dark' : 'Light'} Mode
				</button>
			</form>
			<form action="/login?/logout" method="post" class="logout-button" use:enhance>
				<button type="submit">Logout</button>
			</form>
		</div>
	{/if}
</div>

<style>
	.logout-button {
		background: none;
		border: none;
		color: #ffffff;
		cursor: pointer;
		font-size: 1rem;
	}

	.logout-button:hover {
		text-decoration: underline;
	}

	.user-display {
		position: relative;
		right: 2%;
	}

	.profile-picture {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.profile-picture img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	#thumbnail:hover {
		cursor: pointer;
		opacity: 0.8;
	}

	.placeholder {
		width: 100%;
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(135deg, #6b73ff 0%, #37ff00 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.change-picture {
		position: absolute;
		bottom: 0%;
		right: 0%;
		background-color: #ffffff;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		text-decoration: none;
		border: none;
	}

	.change-picture:hover {
		background-color: #f0f0f0;
	}

	.change-picture:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.dropdown-menu {
		position: absolute;
		top: 120%;
		right: 2%;
		min-width: 280px;
		min-height: 320px;
		background-color: #ffffff;
		color: black;
		border: 1px solid #ddd;
		border-radius: 4px;
		padding-bottom: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.75rem;
		text-align: center;
	}
</style>
