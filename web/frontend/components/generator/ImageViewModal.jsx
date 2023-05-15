import { Modal } from '@shopify/polaris';

export default function ImageViewModal({ onClose, image }) {
  return (
    <Modal onClose={onClose} open title="Image preview">
      <Modal.Section>
        <img
          src={image}
          style={{ height: '100%', display: 'block', margin: '0 auto' }}
        />
      </Modal.Section>
    </Modal>
  );
}
