import { Modal, ModalWrapper, ModalCloseButton } from '@/ui/modal';
import { StyledButtonWrapper, StyledTitle } from './styles';
import { Button } from '@/ui/button';
import { Content, FlexWrapper } from '@/ui/layout';
import Loading from '@/components/loading';
import { usePageHelper } from '@/hooks/use-page-helper';
import { useAppState } from '@/providers/app-state-provider';
import { useEffect, useState } from 'react';
import { useTranslation } from '@affine/i18n';
// import { Tooltip } from '@/ui/tooltip';
type ImportModalProps = {
  open: boolean;
  onClose: () => void;
};
type Template = {
  name: string;
  source: string;
};
export const ImportModal = ({ open, onClose }: ImportModalProps) => {
  const [status, setStatus] = useState<'unImported' | 'importing'>('importing');
  const { openPage, createPage } = usePageHelper();
  const { currentWorkspace } = useAppState();
  const { t } = useTranslation();
  const _applyTemplate = function (pageId: string, template: Template) {
    const page = currentWorkspace?.blocksuiteWorkspace?.getPage(pageId);

    const title = template.name;
    if (page) {
      currentWorkspace?.blocksuiteWorkspace?.setPageMeta(page.id, { title });
      if (page && page.root === null) {
        setTimeout(() => {
          try {
            const editor = document.querySelector('editor-container');
            if (editor) {
              page.addBlock({ flavour: 'affine:surface' }, null);
              const frameId = page.addBlock(
                { flavour: 'affine:frame' },
                pageId
              );
              // TODO blocksuite should offer a method to import markdown from store
              editor.clipboard.importMarkdown(template.source, `${frameId}`);
              page.resetHistory();
              editor.requestUpdate();
            }
          } catch (e) {
            console.error(e);
          }
        }, 300);
      }
    }
  };
  const _handleAppleTemplate = async function (template: Template) {
    const pageId = await createPage();
    if (pageId) {
      openPage(pageId);
      _applyTemplate(pageId, template);
    }
  };
  const _handleAppleTemplateFromFilePicker = async () => {
    if (!window.showOpenFilePicker) {
      return;
    }
    const arrFileHandle = await window.showOpenFilePicker({
      types: [
        {
          accept: {
            'text/markdown': ['.md'],
            'text/html': ['.html', '.htm'],
            'text/plain': ['.text'],
          },
        },
      ],
      multiple: false,
    });
    for (const fileHandle of arrFileHandle) {
      const file = await fileHandle.getFile();
      const text = await file.text();
      _handleAppleTemplate({
        name: file.name,
        source: text,
      });
    }
    onClose && onClose();
  };
  useEffect(() => {
    if (status === 'importing') {
      setTimeout(() => {
        setStatus('unImported');
      }, 1500);
    }
  }, [status]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalWrapper width={460} minHeight={240}>
        <ModalCloseButton onClick={onClose} />
        <StyledTitle>{t('Import')}</StyledTitle>

        {status === 'unImported' && (
          <StyledButtonWrapper>
            <Button
              onClick={() => {
                _handleAppleTemplateFromFilePicker();
              }}
            >
              Markdown
            </Button>
            <Button
              onClick={() => {
                _handleAppleTemplateFromFilePicker();
              }}
            >
              HTML
            </Button>
          </StyledButtonWrapper>
        )}

        {status === 'importing' && (
          <FlexWrapper
            wrap={true}
            justifyContent="center"
            style={{ marginTop: 22, paddingBottom: '32px' }}
          >
            <Loading size={25}></Loading>
            <Content align="center" weight="500">
              OOOOPS! Sorry forgot to remind you that we are working on the
              import function
            </Content>
          </FlexWrapper>
        )}
      </ModalWrapper>
    </Modal>
  );
};

export default ImportModal;
