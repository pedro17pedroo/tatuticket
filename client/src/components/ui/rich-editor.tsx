import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Bold, Italic, Underline, Link, List, ListOrdered, 
  Image, Code, Quote, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo,
  Table, Eye, Save
} from 'lucide-react';

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  className?: string;
}

export function RichEditor({ content, onChange, onSave, className }: RichEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (text: string, cursorOffset = 0) => {
    const editor = editorRef.current;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    
    onChange(newContent);
    
    // Set cursor position after insertion
    setTimeout(() => {
      editor.focus();
      editor.setSelectionRange(start + text.length - cursorOffset, start + text.length - cursorOffset);
    }, 10);
  };

  const formatText = (format: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = "";
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'texto em negrito'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'texto em itálico'}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText || 'texto sublinhado'}</u>`;
        break;
      case 'code':
        formattedText = `\`${selectedText || 'código'}\``;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'citação'}`;
        break;
      case 'h1':
        formattedText = `# ${selectedText || 'Título Principal'}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText || 'Subtítulo'}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText || 'Título Menor'}`;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'Item da lista'}`;
        break;
      case 'ordered-list':
        formattedText = `1. ${selectedText || 'Item numerado'}`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'texto do link'}](url)`;
        break;
      case 'table':
        formattedText = `| Cabeçalho 1 | Cabeçalho 2 | Cabeçalho 3 |\n|-------------|-------------|-------------|\n| Célula 1    | Célula 2    | Célula 3    |\n| Célula 4    | Célula 5    | Célula 6    |`;
        break;
      default:
        return;
    }
    
    insertAtCursor(formattedText, format === 'link' ? 4 : 0);
  };

  const insertImage = () => {
    if (imageUrl) {
      insertAtCursor(`![Descrição da imagem](${imageUrl})`);
      setImageUrl("");
      setShowImageDialog(false);
    }
  };

  const renderPreview = () => {
    // Simple markdown rendering for preview
    let html = content
      .replace(/### (.*$)/gm, '<h3>$1</h3>')
      .replace(/## (.*$)/gm, '<h2>$1</h2>')
      .replace(/# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gm, '<em>$1</em>')
      .replace(/<u>(.*?)<\/u>/gm, '<u>$1</u>')
      .replace(/`(.*?)`/gm, '<code>$1</code>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>')
      .replace(/^1\. (.*$)/gm, '<ol><li>$1</li></ol>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gm, '<a href="$2" target="_blank">$1</a>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gm, '<img src="$2" alt="$1" style="max-width: 100%;" />')
      .replace(/\n/gm, '<br>');

    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            data-testid="button-bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            data-testid="button-italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            data-testid="button-underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('h1')}
            data-testid="button-h1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('h2')}
            data-testid="button-h2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('h3')}
            data-testid="button-h3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('list')}
            data-testid="button-list"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('ordered-list')}
            data-testid="button-ordered-list"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('quote')}
            data-testid="button-quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('link')}
            data-testid="button-link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImageDialog(true)}
            data-testid="button-image"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('code')}
            data-testid="button-code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('table')}
            data-testid="button-table"
          >
            <Table className="h-4 w-4" />
          </Button>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            data-testid="button-preview"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {onSave && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              data-testid="button-save"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Editor/Preview */}
      <div className="h-96">
        {isPreviewMode ? (
          <div className="p-4 h-full overflow-y-auto">
            {renderPreview()}
          </div>
        ) : (
          <textarea
            ref={editorRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full p-4 resize-none border-none outline-none font-mono text-sm"
            placeholder="Digite o conteúdo do artigo usando Markdown..."
            data-testid="textarea-content"
          />
        )}
      </div>
      
      {/* Image Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserir Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL da Imagem</label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                data-testid="input-image-url"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowImageDialog(false)}
                data-testid="button-cancel-image"
              >
                Cancelar
              </Button>
              <Button
                onClick={insertImage}
                data-testid="button-insert-image"
              >
                Inserir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}