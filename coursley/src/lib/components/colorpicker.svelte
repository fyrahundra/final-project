<script lang="ts">
    export let previewColor: string = '#000000';
    export let Colortype: 'highlight' | 'text' = 'text';
    export let applyColorCallback: (color: string) => void = () => {};
    export let clearCallback: () => void = () => {};

    let showPicker = false;
    let draftColor = previewColor;

    $: if (!showPicker) {
        draftColor = previewColor;
    }

    function openPicker(event: MouseEvent) {
        event.preventDefault();
        showPicker = true;
    }

    function closePicker() {
        showPicker = false;
    }

    function applyColor(event: MouseEvent) {
        event.preventDefault();
        applyColorCallback(draftColor);
        closePicker();
    }

    function clearHighlight(event: MouseEvent) {
        event.preventDefault();
        clearCallback();
        closePicker();
    }

    function closeOnBackdrop(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            closePicker();
        }
    }
</script>

<button type="button" class="trigger" title="Open color picker" on:mousedown={openPicker}>
    <div class="trigger-content">
        <p>{Colortype === 'highlight' ? 'H' : 'A'}</p>
        <div class="color-preview" style="background-color: {previewColor};"></div>
    </div>
</button>

{#if showPicker}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="picker-overlay" role="presentation" tabindex="-1" on:mousedown={closeOnBackdrop}>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="picker-modal" role="dialog" aria-modal="true" tabindex="-1" on:mousedown|stopPropagation>
            <input type="color" class="color-input" bind:value={draftColor} />
            <div class="actions">
                {#if Colortype === 'highlight'}
                    <button type="button" class="clear-btn" on:mousedown={clearHighlight}>Clear</button>
                {/if}
                <button type="button" class="apply-btn" on:mousedown={applyColor}
                    >{Colortype === 'highlight' ? 'Apply' : 'Done'}</button
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .trigger {
        border: none;
        background: transparent;
        padding: 4px 8px;
        cursor: pointer;
    }

    .trigger-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
    }

    .trigger-content p {
        margin: 0;
        line-height: 1;
    }

    .color-preview {
        width: 24px;
        height: 5px;
        border-radius: 3px;
        border: 1px solid #dadce0;
        display: inline-block;
    }

    .picker-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.25);
    }

    .picker-modal {
        background: white;
        border: 1px solid #dadce0;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 10px 24px rgba(60, 64, 67, 0.3);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .color-input {
        width: 64px;
        height: 48px;
        padding: 0;
        border: 1px solid #dadce0;
        border-radius: 6px;
        cursor: pointer;
    }

    .actions {
        display: flex;
        gap: 6px;
    }

    .clear-btn,
    .apply-btn {
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
    }

    .clear-btn {
        border: 1px solid #dadce0;
        background: white;
        color: #3c4043;
    }

    .apply-btn {
        border: 1px solid #1a73e8;
        background: #1a73e8;
        color: white;
    }
</style>