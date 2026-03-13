<script lang="ts">
	import { EditorContent } from 'svelte-tiptap';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Subscript from '@tiptap/extension-subscript';
	import Superscript from '@tiptap/extension-superscript';
	import { Color } from '@tiptap/extension-color';
	import { TextStyle, FontFamily } from '@tiptap/extension-text-style';
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { writable } from 'svelte/store';

	let editor: Editor;
	let contentElement: HTMLDivElement;

	export let data;

	// Support both userAssignment (new) and assignment (legacy)
	const currentDoc = data.userAssignment || data.assignment;
	const isTemplate = data.isTemplate || false;
	const templateId = data.templateId || '';
	let title =
		currentDoc?.contentTitle || (isTemplate ? 'Assignment Template' : 'Untitled Document');
	let selectedLang = 'en';
	let currentColor = '#000000';
	let currentFont = 'Arial, sans-serif';
	let currentHeading = 'Normal';
	let saveState: 'idle' | 'saving' | 'saved' | 'error' = 'idle';

	const update = writable(0);

	const langOptions = [
		{ code: 'en', label: 'English' },
		{ code: 'de', label: 'German' },
		{ code: 'fr', label: 'French' },
		{ code: 'es', label: 'Spanish' },
		{ code: 'zh', label: 'Chinese' },
		{ code: 'sv', label: 'Swedish' },
		{ code: 'ru', label: 'Russian' },
		{ code: 'ja', label: 'Japanese' },
		{ code: 'ar', label: 'Arabic' },
		{ code: 'hi', label: 'Hindi' }
	];

	const fontOptions = [
		{ name: 'Arial', value: 'Arial, sans-serif' },
		{ name: 'Times New Roman', value: '"Times New Roman", serif' },
		{ name: 'Courier New', value: '"Courier New", monospace' },
		{ name: 'Georgia', value: 'Georgia, serif' },
		{ name: 'Verdana', value: 'Verdana, sans-serif' }
	];

	const headerOptions = [
		{
			label: 'Normal',
			action: () => editor?.chain().focus().clearNodes().run(),
			isActive: () => !editor?.isActive('heading')
		},
		{
			label: 'H1',
			level: 1,
			action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
			isActive: () => editor?.isActive('heading', { level: 1 })
		},
		{
			label: 'H2',
			level: 2,
			action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
			isActive: () => editor?.isActive('heading', { level: 2 })
		},
		{
			label: 'H3',
			level: 3,
			action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
			isActive: () => editor?.isActive('heading', { level: 3 })
		},
		{
			label: 'H4',
			level: 4,
			action: () => editor?.chain().focus().toggleHeading({ level: 4 }).run(),
			isActive: () => editor?.isActive('heading', { level: 4 })
		},
		{
			label: 'H5',
			level: 5,
			action: () => editor?.chain().focus().toggleHeading({ level: 5 }).run(),
			isActive: () => editor?.isActive('heading', { level: 5 })
		},
		{
			label: 'H6',
			level: 6,
			action: () => editor?.chain().focus().toggleHeading({ level: 6 }).run(),
			isActive: () => editor?.isActive('heading', { level: 6 })
		}
	];

	// Formating functions
	const formatingOptions = [
		// Text formatting
		{ name: 'Bold', ...actionTemplate((chain) => chain.toggleBold(), 'bold') },
		{ name: 'Italic', ...actionTemplate((chain) => chain.toggleItalic(), 'italic') },
		{ name: 'Underline', ...actionTemplate((chain) => chain.toggleUnderline(), 'underline') },
		{ name: 'Strikethrough', ...actionTemplate((chain) => chain.toggleStrike(), 'strike') },
		{ name: 'Subscript', ...actionTemplate((chain) => chain.toggleSubscript(), 'subscript') },
		{ name: 'Superscript', ...actionTemplate((chain) => chain.toggleSuperscript(), 'superscript') },
		// List formatting
		{ name: 'List', ...actionTemplate((chain) => chain.toggleBulletList(), 'bulletList') },
		{
			name: 'Numbered List',
			...actionTemplate((chain) => chain.toggleOrderedList(), 'orderedList')
		}
	];

	onMount(() => {
		let startContent = { type: 'doc', content: [{ type: 'paragraph' }] };
		if (currentDoc?.content) {
			try {
				startContent = JSON.parse(currentDoc.content);
			} catch (error) {
				console.error('Invalid editor content JSON, using empty document.', error);
			}
		}
		editor = new Editor({
			element: contentElement,
			extensions: [StarterKit, Subscript, Superscript, Color, TextStyle, FontFamily],
			content: startContent,
			editorProps: {
				attributes: {
					class: 'ProseMirror',
					spellcheck: 'true',
					lang: selectedLang
				}
			},

			onUpdate: () => {
				update.update((n) => n + 1);
			},
			onSelectionUpdate: () => {
				update.update((n) => n + 1);
			},
			onTransaction: () => {
				update.update((n) => n + 1);
				const color = editor?.getAttributes('textStyle').color;
				currentColor = color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#000000';
				const fontFamily = editor?.getAttributes('textStyle').fontFamily;
				currentFont = fontFamily && fontFamily.trim() ? fontFamily : 'Arial, sans-serif';
				const activeHeader = headerOptions.find((h) => h.isActive?.());
				currentHeading = activeHeader?.label || 'Normal';
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	const handleClick = () => {
		editor?.commands.focus();
	};

	function changeLanguage(lang: string) {
		selectedLang = lang;
		editor.view.dom.setAttribute('lang', lang);
	}

	function changeColor(color: string) {
		currentColor = color;
		editor?.chain().focus().setColor(color).run();
	}

	const saveDocument = () => {
		const content = editor?.getJSON();
		const formData = new FormData();

		saveState = 'saving';

		if (isTemplate) {
			// Template mode - save to localStorage and close
			formData.append('content', JSON.stringify(content));
			formData.append('templateId', templateId);

			fetch('/RTE?/saveTemplate', {
				method: 'POST',
				body: formData
			})
				.then((response) => {
					if (!response.ok) {
						console.error('HTTP error:', response.status);
						return response.text().then((text) => {
							throw new Error(`Server error: ${response.status} - ${text}`);
						});
					}
					return response.json();
				})
				.then((result) => {
					if (result.success || result.type === 'success') {
						console.log('Template saved successfully');
						// Store in localStorage for parent window to retrieve
						localStorage.setItem(templateId, JSON.stringify({ content: JSON.stringify(content) }));
						saveState = 'saved';
						// Close window after 1 second
						setTimeout(() => window.close(), 1000);
					} else {
						console.error('Failed to save template:', result);
						saveState = 'error';
						setTimeout(() => (saveState = 'idle'), 2000);
					}
				})
				.catch((error) => {
					console.error('Error saving template:', error);
					saveState = 'error';
					setTimeout(() => (saveState = 'idle'), 2000);
				});
		} else {
			// Regular document save
			formData.append('id', currentDoc?.id || '');
			formData.append('content', JSON.stringify(content));

			fetch('/RTE?/saveDocument', {
				method: 'POST',
				body: formData
			})
				.then((response) => response.json())
				.then((result) => {
					if (result.success || result.type === 'success') {
						console.log('Document saved successfully');
						saveState = 'saved';
						setTimeout(() => (saveState = 'idle'), 2000);
					} else {
						console.error('Failed to save document');
						saveState = 'error';
						setTimeout(() => (saveState = 'idle'), 2000);
					}
				})
				.catch((error) => {
					console.error('Error saving document:', error);
					saveState = 'error';
					setTimeout(() => (saveState = 'idle'), 2000);
				});
		}
	};

	function actionTemplate(
		commandFn: (chain: any) => any,
		activeCheck: string,
		activeOptions: any = {}
	) {
		return {
			action: () => {
				commandFn(editor?.chain().focus()).run();
				update.update((n) => n + 1);
			},
			isActive: () =>
				activeOptions ? editor?.isActive(activeCheck, activeOptions) : editor?.isActive(activeCheck)
		};
	}
</script>

<div class="editor-header">
	<div class="header-top">
		{#if isTemplate}
			<div class="template-title">
				<h2>{title}</h2>
				<p class="template-label">Template Mode</p>
			</div>
		{:else}
			<form
				action="/RTE?/changeTitle"
				method="POST"
				use:enhance={() => {
					return async ({ result }) => {
						if (
							result.type === 'success' &&
							result.data &&
							typeof result.data === 'object' &&
							'assignment' in result.data
						) {
							title = (result.data as { assignment: { contentTitle: string } }).assignment
								.contentTitle;
						} else {
							console.error('Failed to update title');
						}
					};
				}}
			>
				<input
					class="editor-title"
					name="title"
					type="text"
					bind:value={title}
					aria-label="Document title"
					onblur={(e) => e.currentTarget.form?.requestSubmit()}
				/>
				<input type="hidden" name="id" value={currentDoc?.id} />
			</form>
		{/if}
		<div class="toolbar">
			<div class="toolbar-section">
				<select
					class="font-select"
					bind:value={currentFont}
					onchange={(e) => {
						currentFont = (e.target as HTMLSelectElement).value;
						editor?.chain().focus().setFontFamily(currentFont).run();
					}}
				>
					{#each fontOptions as option}
						<option value={option.value}>{option.name}</option>
					{/each}
				</select>
				<select
					class="header-select"
					bind:value={currentHeading}
					onchange={(e) => {
						const selectedLabel = (e.target as HTMLSelectElement).value;
						const header = headerOptions.find((h) => h.label === selectedLabel);
						if (header) {
							header.action();
							editor?.commands.focus();
							update.update((n) => n + 1);
						}
					}}
				>
					{#each headerOptions as option}
						<option value={option.label}>{option.label}</option>
					{/each}
				</select>
			</div>
			<div class="toolbar-divider"></div>
			<div class="toolbar-section editor-controls">
				{#each formatingOptions as option}
					{#key $update}
						<button
							type="button"
							onmousedown={(e) => {
								e.preventDefault();
								option.action();
							}}
							class:active={option.isActive()}
							title={option.name}
						>
							{option.name}
						</button>
					{/key}
				{/each}
			</div>
			<div class="toolbar-divider"></div>
			<div class="toolbar-section">
				<label for="colorPicker" class="color-picker-label">
					<input
						type="color"
						name="color"
						id="colorPicker"
						bind:value={currentColor}
						oninput={(e) => changeColor((e.target as HTMLInputElement).value)}
					/>
					<span class="color-preview" style="background-color: {currentColor}"></span>
				</label>
				<select
					class="lang-select"
					bind:value={selectedLang}
					onchange={(e) => changeLanguage((e.target as HTMLSelectElement).value)}
				>
					{#each langOptions as option}
						<option value={option.code}>{option.label}</option>
					{/each}
				</select>
			</div>
			<div class="toolbar-section save-section">
				<button
					class="save-btn"
					class:saving={saveState === 'saving'}
					class:saved={saveState === 'saved'}
					class:error={saveState === 'error'}
					disabled={saveState === 'saving'}
					onmousedown={(e) => {
						e.preventDefault();
						if (saveState !== 'saving') {
							saveDocument();
						}
					}}
				>
					{#if saveState === 'saving'}
						⏳ Saving...
					{:else if saveState === 'saved'}
						✅ Saved!
					{:else if saveState === 'error'}
						❌ Error
					{:else}
						💾 Save
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="editor-container" onclick={handleClick}>
	<div bind:this={contentElement} class="editor-content"></div>
</div>

<style>
	.editor-container {
		border: 1px solid #dadce0;
		border-radius: 0;
		padding: 3rem 5rem;
		height: 100%;
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		box-sizing: border-box;
		overflow: auto;
		background: white;
		box-shadow:
			0 1px 2px 0 rgba(60, 64, 67, 0.3),
			0 1px 3px 1px rgba(60, 64, 67, 0.15);
	}
	.editor-container:hover {
		border-color: #dadce0;
		cursor: text;
	}

	.editor-header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: #f9fbfd;
		border-bottom: 1px solid #dadce0;
		padding: 8px 16px 0 16px;
		margin-bottom: 1rem;
		width: 100%;
		box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.1);
	}

	.header-top {
		padding: 8px 0 4px 0;
	}

	.editor-title {
		font-size: 1.25rem;
		font-weight: 400;
		border: none;
		background: transparent;
		padding: 6px 8px;
		outline: none;
		width: 100%;
		color: #202124;
		border-radius: 2px;
		transition: background 0.2s;
	}

	.editor-title:hover {
		background: rgba(60, 64, 67, 0.04);
	}

	.editor-title:focus {
		background: white;
		box-shadow:
			0 0 0 1px #1a73e8,
			0 0 0 3px rgba(26, 115, 232, 0.1);
	}

	.toolbar {
		display: flex;
		gap: 4px;
		align-items: center;
		padding: 4px 0 8px 0;
		flex-wrap: wrap;
	}

	.toolbar-section {
		display: flex;
		gap: 2px;
		align-items: center;
	}

	.toolbar-divider {
		width: 1px;
		height: 24px;
		background: #dadce0;
		margin: 0 8px;
	}

	.editor-controls {
		display: flex;
		gap: 2px;
	}

	.editor-controls button {
		background: transparent;
		border: none;
		color: #3c4043;
		padding: 6px 10px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background 0.2s;
		white-space: nowrap;
	}

	.editor-controls button:hover {
		background: rgba(60, 64, 67, 0.08);
	}

	.editor-controls button.active {
		background: #e8f0fe;
		color: #1967d2;
	}

	select,
	.font-select,
	.lang-select,
	.header-select {
		background: white;
		border: 1px solid #dadce0;
		border-radius: 4px;
		padding: 6px 24px 6px 8px;
		font-size: 0.875rem;
		color: #3c4043;
		cursor: pointer;
		outline: none;
		transition: all 0.2s;
		appearance: none;
		background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
		background-repeat: no-repeat;
		background-position: right 4px center;
		background-size: 16px;
	}

	select:hover,
	.font-select:hover,
	.lang-select:hover,
	.header-select:hover {
		background-color: rgba(60, 64, 67, 0.04);
		border-color: #5f6368;
	}

	select:focus,
	.font-select:focus,
	.lang-select:focus,
	.header-select:focus {
		border-color: #1a73e8;
		box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.1);
	}

	.font-select {
		min-width: 140px;
	}

	.header-select {
		min-width: 100px;
	}

	.color-picker-label {
		position: relative;
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.color-picker-label:hover {
		background: rgba(60, 64, 67, 0.08);
	}

	#colorPicker {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.color-preview {
		width: 24px;
		height: 24px;
		border-radius: 3px;
		border: 1px solid #dadce0;
		display: inline-block;
		cursor: pointer;
	}

	.save-section {
		margin-left: auto;
	}

	.save-btn {
		background: #1a73e8;
		border: none;
		color: white;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
		box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3);
	}

	.save-btn:hover {
		background: #1765cc;
		box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.4);
	}

	.save-btn:active {
		background: #1557b0;
	}

	.save-btn.saving {
		background: #5f6368;
		cursor: not-allowed;
		opacity: 0.8;
	}

	.save-btn.saved {
		background: #1e8e3e;
	}

	.save-btn.saved:hover {
		background: #188038;
	}

	.save-btn.error {
		background: #d93025;
	}

	.save-btn.error:hover {
		background: #c5221f;
	}

	.save-btn:disabled {
		cursor: not-allowed;
		opacity: 0.8;
	}

	:global(.ProseMirror) {
		height: 100%;
		outline: none;
		font-family: Arial, sans-serif;
		font-size: 11pt;
		line-height: 1.6;
		color: #202124;
	}

	:global(html, body) {
		height: 100%;
		margin: 0;
		overflow: visible;
		background: #f1f3f4;
	}

	.template-title {
		padding: 8px 0 4px 0;
	}

	.template-title h2 {
		font-size: 1.25rem;
		font-weight: 400;
		margin: 0;
		padding: 6px 8px;
		color: #202124;
	}

	.template-label {
		font-size: 0.875rem;
		color: #5f6368;
		margin: 4px 8px 0 8px;
		padding: 0;
		display: inline-block;
		background: #e8f0fe;
		color: #1967d2;
		padding: 2px 8px;
		border-radius: 3px;
	}
</style>
