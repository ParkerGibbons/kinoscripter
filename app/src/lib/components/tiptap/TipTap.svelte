<script>
	import './styles.scss';

	import StarterKit from '@tiptap/starter-kit';
	import { Editor } from '@tiptap/core';
	import { onMount } from 'svelte';

	import Button from '../ui/Button/Button.svelte';
	import Separator from '../ui/separator/separator.svelte';

	let element;
	let editor;

	onMount(() => {
		editor = new Editor({
			element: element,
			extensions: [StarterKit],
			content: `
			  <h2>
				Hi there,
			  </h2>
			  <p>
				this is a <em>basic</em> example of <strong>tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
			  </p>
			  <ul>
				<li>
				  That’s a bullet list with one …
				</li>
				<li>
				  … or two list items.
				</li>
			  </ul>
			  <p>
				Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
			  </p>
			  <pre><code class="language-css">body {
		  display: none;
		}</code></pre>
			  <p>
				I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
			  </p>
			  <blockquote>
				Wow, that’s amazing. Good work, boy! 👏
				<br />
				— Mom
			  </blockquote>
			`,
			onTransaction: () => {
				// force re-render so `editor.isActive` works as expected
				editor = editor;
			}
		});
	});
</script>

{#if editor}
	<div>
		<div class="flex flex-wrap gap-1">
			<Button
				variant="secondary"
				on:click={() => console.log && editor.chain().focus().toggleBold().run()}
				disabled={!editor.can().chain().focus().toggleBold().run()}
				class={editor.isActive('bold') ? 'is-active' : ''}
			>
				bold
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleItalic().run()}
				disabled={!editor.can().chain().focus().toggleItalic().run()}
				class={editor.isActive('italic') ? 'is-active' : ''}
			>
				italic
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleStrike().run()}
				disabled={!editor.can().chain().focus().toggleStrike().run()}
				class={editor.isActive('strike') ? 'is-active' : ''}
			>
				strike
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleCode().run()}
				disabled={!editor.can().chain().focus().toggleCode().run()}
				class={editor.isActive('code') ? 'is-active' : ''}
			>
				code
			</Button>
			<Button variant="secondary" on:click={() => editor.chain().focus().unsetAllMarks().run()}>
				clear marks
			</Button>
			<Button variant="secondary" on:click={() => editor.chain().focus().clearNodes().run()}>
				clear nodes
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().setParagraph().run()}
				class={editor.isActive('paragraph') ? 'is-active' : ''}
			>
				paragraph
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				class={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
			>
				h1
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				class={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
			>
				h2
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				class={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
			>
				h3
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
				class={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}
			>
				h4
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
				class={editor.isActive('heading', { level: 5 }) ? 'is-active' : ''}
			>
				h5
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
				class={editor.isActive('heading', { level: 6 }) ? 'is-active' : ''}
			>
				h6
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleBulletList().run()}
				class={editor.isActive('bulletList') ? 'is-active' : ''}
			>
				bullet list
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleOrderedList().run()}
				class={editor.isActive('orderedList') ? 'is-active' : ''}
			>
				ordered list
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleCodeBlock().run()}
				class={editor.isActive('codeBlock') ? 'is-active' : ''}
			>
				code block
			</Button>
			<Button
				variant="secondary"
				on:click={() => editor.chain().focus().toggleBlockquote().run()}
				class={editor.isActive('blockquote') ? 'is-active' : ''}
			>
				blockquote
			</Button>
			<Button on:click={() => editor.chain().focus().setHorizontalRule().run()} variant="secondary">
				horizontal rule
			</Button>
			<Button on:click={() => editor.chain().focus().setHardBreak().run()} variant="secondary">
				hard break
			</Button>
			<Button
				on:click={() => editor.chain().focus().undo().run()}
				disabled={!editor.can().chain().focus().undo().run()}
				variant="secondary"
			>
				undo
			</Button>
			<Button
				on:click={() => editor.chain().focus().redo().run()}
				disabled={!editor.can().chain().focus().redo().run()}
				variant="secondary"
			>
				redo
			</Button>
		</div>
	</div>
{/if}
<Separator class="my-4" />
<div class="px-8 mx-auto prose prose-md dark:prose-invert" bind:this={element} />

<style>
	Button.active {
		background: black;
		color: white;
	}
</style>
