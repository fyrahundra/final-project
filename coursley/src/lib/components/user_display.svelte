<script>
	import { enhance } from '$app/forms';

	export let user;
	let isOpen = false;

	function dropdown() {
		isOpen = !isOpen;
	}

    function changeProfilePic() {
        // Placeholder for changing profile picture functionality
        alert('Change profile picture functionality is not implemented yet.');
    }
</script>

<div class="user-display">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="profile-picture" id="thumbnail" class:show={isOpen} onclick={dropdown}>
        {#if user.profilePictureUrl}
            <img src="{user.profilePictureUrl}" alt="" />
        {:else}
            <div class="placeholder">
                <p>{user.name.charAt(0).toUpperCase()}</p>
            </div>
        {/if}
    </div>

    {#if isOpen}
        <div class="dropdown-menu">
            <p>{user.email}</p>
            <div class="profile-picture" style="width: 120px; height: 120px;">
                {#if user.profilePictureUrl}
                    <img src="{user.profilePictureUrl}" alt="" />
                {:else}
                    <div class="placeholder" style="font-size: 3rem; color: #ffffff;">
                        <p>{user.name.charAt(0).toUpperCase()}</p>
                    </div>
                {/if}
            </div>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="change-picture" onclick={() => changeProfilePic()}>
                🔄
            </div>
            <h2> Hej <strong>{user.name}</strong>!</h2>
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
        bottom: 48%;
        right: 29%;
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
    }

    .change-picture:hover {
        background-color: #f0f0f0;
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