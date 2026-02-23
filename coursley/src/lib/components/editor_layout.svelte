<script>
    export let data
</script>

<main>
    <slot></slot>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 95vw;
        height: 95vh;
        padding: 1rem;
    }
</style>