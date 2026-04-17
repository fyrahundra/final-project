<script lang="ts">
	import { EditorContent } from 'svelte-tiptap';
	import { Editor } from '@tiptap/core';
	//Tiptap extensions
	import StarterKit from '@tiptap/starter-kit';
	import Subscript from '@tiptap/extension-subscript';
	import Superscript from '@tiptap/extension-superscript';
	import Highlight from '@tiptap/extension-highlight';
	import { Color } from '@tiptap/extension-color';
	import { TextStyle, FontFamily } from '@tiptap/extension-text-style';
	import { CharacterCount } from '@tiptap/extensions';

	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { writable } from 'svelte/store';

	import Colorpicker from './colorpicker.svelte';

	let editor: Editor;
	let contentElement: HTMLDivElement;

	export let data;

	// Support both userAssignment (new) and assignment (legacy)
	const currentDoc = data.userAssignment || data.assignment;
	const isTemplate = data.isTemplate || false;
	const isViewingSubmission = data.isViewingSubmission || false;
	const isInstructorReadOnly = data.isInstructorReadOnly || false;
	let isSubmitted = currentDoc?.status === 'submitted';
	let isReadOnly = isInstructorReadOnly || isViewingSubmission || isSubmitted;
	const templateId = data.templateId || '';
	let title =
		currentDoc?.contentTitle || (isTemplate ? 'Assignment Template' : 'Untitled Document');
	let selectedLang = 'en';
	let currentColor = '#000000';
	let currentHighlightColor = '';
	let currentFont = 'Arial, sans-serif';
	let currentHeading = 'Normal';
	let saveState: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
	let turnInState: 'idle' | 'submitting' | 'submitted' | 'error' = 'idle';
	let submissionSource: EventSource | null = null;
	let hasUnsavedChanges = false;
	let lastSavedTime = data.userAssignment?.savedAt
		? new Date(data.userAssignment.updatedAt).toLocaleTimeString([], {
				hour: '2-digit',
				minute: '2-digit'
			})
		: 'Never';
	let autoSaveLabel = '30s';
	const characterLimit = 10000;

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
			extensions: [
				StarterKit,
				Subscript,
				Superscript,
				Highlight.configure({ multicolor: true }),
				Color,
				TextStyle,
				FontFamily,
				CharacterCount.configure({
					limit: characterLimit
				})
			],
			editable: !isReadOnly,
			content: startContent,
			editorProps: {
				attributes: {
					class: 'ProseMirror',
					spellcheck: 'true',
					lang: selectedLang
				}
			},

			onUpdate: () => {
				if (!isReadOnly && !isTemplate) {
					hasUnsavedChanges = true;
				}
				update.update((n) => n + 1);
			},
			onSelectionUpdate: () => {
				update.update((n) => n + 1);
			},
			onTransaction: () => {
				update.update((n) => n + 1);
				const color = editor?.getAttributes('textStyle').color;
				currentColor = color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#000000';
				const highlightColor = editor?.getAttributes('highlight').color;
				currentHighlightColor =
					highlightColor && /^#[0-9a-f]{6}$/i.test(highlightColor) ? highlightColor : '';
				const fontFamily = editor?.getAttributes('textStyle').fontFamily;
				currentFont = fontFamily && fontFamily.trim() ? fontFamily : 'Arial, sans-serif';
				const activeHeader = headerOptions.find((h) => h.isActive?.());
				currentHeading = activeHeader?.label || 'Normal';
			}
		});
	});

	onDestroy(() => {
		submissionSource?.close();
		if (editor) {
			editor.destroy();
		}
	});

	onMount(() => {
		submissionSource = new EventSource('/streams');

		submissionSource.addEventListener('autosave_tick', (event) => {
			if (isReadOnly || isTemplate || !currentDoc?.id) return;
			if (!hasUnsavedChanges || saveState === 'saving') return;

			const message = event as MessageEvent<string>;
			try {
				const payload = JSON.parse(message.data) as { intervalMs?: number };
				if (typeof payload.intervalMs === 'number' && payload.intervalMs > 0) {
					autoSaveLabel = `${Math.round(payload.intervalMs / 1000)}s`;
				}
			} catch (error) {
				console.error('Invalid autosave tick payload.', error);
			}

			void saveDocument({ auto: true });
		});

		submissionSource.addEventListener('assignment_submitted', (event) => {
			const message = event as MessageEvent<string>;
			const payload = JSON.parse(message.data) as {
				assignmentId: string;
				userAssignmentId: string;
				status: string;
			};

			const currentId = currentDoc?.id;
			if (!currentId) return;

			if (payload.userAssignmentId === currentId || payload.assignmentId === currentId) {
				isSubmitted = payload.status === 'submitted';
				isReadOnly = isInstructorReadOnly || isViewingSubmission || isSubmitted;
				turnInState = isSubmitted ? 'submitted' : 'idle';
				hasUnsavedChanges = false;
				editor?.setEditable(!isReadOnly);
				lastSavedTime = new Date().toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit'
				});
			}
		});
	});

	const handleClick = () => {
		if (!isReadOnly) {
			editor?.commands.focus();
		}
	};

	function changeLanguage(lang: string) {
		selectedLang = lang;
		editor.view.dom.setAttribute('lang', lang);
	}

	function changeColor(color: string) {
		if (isReadOnly) return;
		currentColor = color;
		editor?.chain().focus().setColor(color).run();
	}

	function highlightColor(color: string) {
		if (isReadOnly) return;
		currentHighlightColor = color;
		editor?.chain().focus().setHighlight({ color }).run();
	}

	function clearHighlight() {
		if (isReadOnly) return;
		currentHighlightColor = '';
		editor?.chain().focus().unsetHighlight().run();
	}

	function getCharacterCount() {
		return editor?.storage?.characterCount?.characters() ?? 0;
	}

	function getWordCount() {
		return editor?.storage?.characterCount?.words() ?? 0;
	}

	const saveDocument = async ({ auto = false }: { auto?: boolean } = {}) => {
		if (isReadOnly) return;
		if (saveState === 'saving') return;
		if (auto && !hasUnsavedChanges) return;
		const content = editor?.getJSON();
		const formData = new FormData();

		saveState = 'saving';

		if (isTemplate) {
			// Template mode - save to localStorage and close
			formData.append('content', JSON.stringify(content));
			formData.append('templateId', templateId);

			try {
				const response = await fetch('/RTE?/saveTemplate', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					console.error('HTTP error:', response.status);
					const text = await response.text();
					throw new Error(`Server error: ${response.status} - ${text}`);
				}

				const result = await response.json();
				if (result.success || result.type === 'success') {
					console.log('Template saved successfully');
					localStorage.setItem(templateId, JSON.stringify({ content: JSON.stringify(content) }));
					saveState = 'saved';
					setTimeout(() => window.close(), 1000);
				} else {
					console.error('Failed to save template:', result);
					saveState = 'error';
					setTimeout(() => (saveState = 'idle'), 2000);
				}
			} catch (error) {
				console.error('Error saving template:', error);
				saveState = 'error';
				setTimeout(() => (saveState = 'idle'), 2000);
			}
		} else {
			// Regular document save
			formData.append('id', currentDoc?.id || '');
			formData.append('content', JSON.stringify(content));

			try {
				const response = await fetch('/RTE?/saveDocument', {
					method: 'POST',
					body: formData
				});
				const result = await response.json();

				if (result.success || result.type === 'success') {
					if (!auto) {
						console.log('Document saved successfully');
					}
					hasUnsavedChanges = false;
					saveState = 'saved';
					lastSavedTime = new Date().toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit'
					});
					setTimeout(() => (saveState = 'idle'), 2000);
				} else {
					console.error('Failed to save document');
					saveState = 'error';
					setTimeout(() => (saveState = 'idle'), 2000);
				}
			} catch (error) {
				console.error('Error saving document:', error);
				saveState = 'error';
				setTimeout(() => (saveState = 'idle'), 2000);
			}
		}
	};

	const turnInDocument = () => {
		if (isReadOnly) return;
		const content = editor?.getJSON();
		const formData = new FormData();

		formData.append('id', currentDoc?.id || '');
		formData.append('content', JSON.stringify(content));

		turnInState = 'submitting';

		fetch('/RTE?/turnIn', {
			method: 'POST',
			body: formData
		})
			.then((response) => response.json())
			.then((result) => {
				if (result.success || result.type === 'success') {
					console.log('Document turned in successfully');
					hasUnsavedChanges = false;
					turnInState = 'submitted';
					setTimeout(() => (turnInState = 'idle'), 2000);
				} else {
					console.error('Failed to turn in document');
					turnInState = 'error';
					setTimeout(() => (turnInState = 'idle'), 2000);
				}
			})
			.catch((error) => {
				console.error('Error turning in document:', error);
				turnInState = 'error';
				setTimeout(() => (turnInState = 'idle'), 2000);
			});
	};

	function actionTemplate(
		commandFn: (chain: any) => any,
		activeCheck: string,
		activeOptions: any = {}
	) {
		return {
			action: () => {
				if (isReadOnly) return;
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
					readonly={isReadOnly}
					aria-label="Document title"
					onblur={(e) => e.currentTarget.form?.requestSubmit()}
				/>
				<input type="hidden" name="id" value={currentDoc?.id} />
			</form>
		{/if}
		{#if isReadOnly}
			<p class="readonly-banner">This submission is read-only.</p>
		{/if}
		<div class="toolbar">
			{#if !isReadOnly}
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
					<Colorpicker
						previewColor={currentColor}
						Colortype="text"
						applyColorCallback={changeColor}
					/>
					<Colorpicker
						previewColor={currentHighlightColor}
						Colortype="highlight"
						clearCallback={clearHighlight}
						applyColorCallback={highlightColor}
					/>
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
			{/if}
			<div class="toolbar-section save-section">
				<p>Last saved: {lastSavedTime}</p>
				{#if !isReadOnly && !isTemplate}
					<p>Autosave: every {autoSaveLabel}</p>
				{/if}
				{#key $update}
					<div class="count-display">
						{getCharacterCount()} / {characterLimit} chars • {getWordCount()} words
					</div>
				{/key}
				{#if !isReadOnly}
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
					<button
						class="turn-in-btn"
						class:submitting={turnInState === 'submitting'}
						class:submitted={turnInState === 'submitted'}
						class:error={turnInState === 'error'}
						disabled={turnInState === 'submitting'}
						onmousedown={(e) => {
							e.preventDefault();
							if (turnInState !== 'submitting') {
								saveDocument();
								turnInDocument();
							}
						}}
					>
						{#if turnInState === 'submitting'}
							⏳ Submitting...
						{:else if turnInState === 'submitted'}
							✅ Submitted!
						{:else if turnInState === 'error'}
							❌ Error
						{:else}
							📤 Turn In
						{/if}
					</button>
				{/if}
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
		border-radius: 2px;
		padding: 4.5rem 4.75rem 5rem;
		width: min(100%, 816px);
		height: 1056px;
		margin: 0 auto 2.75rem;
		box-sizing: border-box;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: none;
		-ms-overflow-style: none;
		background: white;
		box-shadow:
			0 1px 3px rgba(60, 64, 67, 0.2),
			0 10px 30px rgba(60, 64, 67, 0.16);
	}

	.editor-container::-webkit-scrollbar {
		display: none;
	}
	.editor-container:hover {
		border-color: #dadce0;
		cursor: text;
	}

	.editor-header {
		position: sticky;
		top: 0;
		z-index: 20;
		background: linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%);
		border: 1px solid #d8dde3;
		border-radius: 14px;
		padding: 10px 14px;
		margin: 0 auto 14px;
		width: min(100%, 980px);
		box-sizing: border-box;
		box-shadow: 0 2px 10px rgba(60, 64, 67, 0.12);
	}

	.header-top {
		padding: 2px 0;
	}

	.editor-title {
		font-size: 1.4rem;
		font-weight: 400;
		border: none;
		background: transparent;
		padding: 7px 10px;
		outline: none;
		width: min(100%, 640px);
		color: #202124;
		border-radius: 8px;
		transition: background 0.2s ease;
	}

	.editor-title:hover {
		background: rgba(60, 64, 67, 0.04);
	}

	.editor-title:focus {
		background: white;
		box-shadow:
			0 0 0 1px #1a73e8,
			0 0 0 4px rgba(26, 115, 232, 0.12);
	}

	.toolbar {
		display: flex;
		gap: 6px;
		align-items: center;
		padding: 8px 0 2px;
		flex-wrap: wrap;
	}

	.toolbar-section {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.toolbar-divider {
		width: 1px;
		height: 28px;
		background: #dde2e7;
		margin: 0 6px;
	}

	.editor-controls {
		display: flex;
		gap: 3px;
	}

	.editor-controls button {
		background: #ffffff;
		border: 1px solid transparent;
		color: #3c4043;
		padding: 6px 10px;
		border-radius: 7px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: background 0.2s ease;
		white-space: nowrap;
	}

	.editor-controls button:hover {
		background: #f1f3f4;
	}

	.editor-controls button.active {
		background: #e8f0fe;
		border-color: #d2e3fc;
		color: #1967d2;
	}

	select,
	.font-select,
	.lang-select,
	.header-select {
		background: #ffffff;
		border: 1px solid #dadce0;
		border-radius: 8px;
		padding: 7px 28px 7px 10px;
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

	:global(.active-highlight) {
		background: #e8f0fe;
	}

	.save-section {
		margin-left: auto;
		gap: 8px;
		padding-left: 4px;
	}

	.save-section p {
		font-size: 0.8rem;
		color: #5f6368;
		white-space: nowrap;
		margin: 0;
		padding: 5px 10px;
	}

	.count-display {
		font-size: 0.8rem;
		color: #5f6368;
		white-space: nowrap;
		padding: 5px 10px;
		background: #f1f3f4;
		border-radius: 999px;
	}

	.readonly-banner {
		margin: 0 0 8px;
		padding: 7px 11px;
		border-radius: 4px;
		background: #fef7e0;
		color: #8d6e00;
		font-size: 0.85rem;
		border: 1px solid #f9df8b;
	}

	.save-btn {
		background: #1a73e8;
		border: none;
		color: white;
		padding: 8px 14px;
		border-radius: 18px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
		box-shadow: 0 1px 2px rgba(60, 64, 67, 0.22);
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

	.turn-in-btn {
		background: #1a73e8;
		border: none;
		color: white;
		padding: 8px 14px;
		border-radius: 18px;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
		box-shadow: 0 1px 2px rgba(60, 64, 67, 0.22);
	}

	.turn-in-btn:hover {
		background: #1765cc;
		box-shadow: 0 1px 3px 0 rgba(60, 64, 67, 0.4);
	}

	.turn-in-btn:active {
		background: #1557b0;
	}

	.turn-in-btn.submitting {
		background: #5f6368;
		cursor: not-allowed;
		opacity: 0.8;
	}

	.turn-in-btn.submitted {
		background: #1e8e3e;
	}

	.turn-in-btn.submitted:hover {
		background: #188038;
	}

	.turn-in-btn.error {
		background: #d93025;
	}

	.turn-in-btn.error:hover {
		background: #c5221f;
	}

	:global(.ProseMirror) {
		min-height: 900px;
		height: 100%;
		outline: none;
		font-family: Arial, sans-serif;
		font-size: 11pt;
		line-height: 1.55;
		color: #202124;
	}

	:global(.ProseMirror p) {
		margin: 0 0 0.75rem;
	}

	:global(html, body) {
		height: 100%;
		margin: 0;
		overflow: auto;
		background: #edf1f7;
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

	@media (max-width: 920px) {
		.editor-header {
			border-radius: 12px;
			padding: 8px 10px;
		}

		.editor-container {
			width: 100%;
			height: calc(100vh - 190px);
			padding: 2.25rem 1.25rem 2.75rem;
			box-shadow: 0 6px 20px rgba(60, 64, 67, 0.14);
		}

		.save-section {
			width: 100%;
			margin-left: 0;
			justify-content: flex-end;
			padding-top: 4px;
		}

		.editor-title {
			font-size: 1.2rem;
		}
	}
</style>
