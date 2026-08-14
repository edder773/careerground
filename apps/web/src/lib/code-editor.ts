import { EditorView, type ReactCodeMirrorProps } from '@uiw/react-codemirror';

export type EditorExtensions = NonNullable<ReactCodeMirrorProps['extensions']>;

export const codeEditorAccessibility = EditorView.contentAttributes.of({
  'aria-label': '풀이 코드',
});

export async function loadLanguageExtensions(language: string): Promise<EditorExtensions> {
  switch (language) {
    case 'javascript': {
      const { javascript } = await import('@codemirror/lang-javascript');
      return [javascript({ typescript: true })];
    }
    case 'python': {
      const { python } = await import('@codemirror/lang-python');
      return [python()];
    }
    case 'java': {
      const { java } = await import('@codemirror/lang-java');
      return [java()];
    }
    case 'cpp': {
      const { cpp } = await import('@codemirror/lang-cpp');
      return [cpp()];
    }
    case 'sql': {
      const { sql } = await import('@codemirror/lang-sql');
      return [sql()];
    }
    default:
      return [];
  }
}
