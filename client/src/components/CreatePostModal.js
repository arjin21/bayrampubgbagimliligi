import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePost } from '../contexts/PostContext';
import { FaTimes, FaImage, FaMapMarkerAlt, FaTag } from 'react-icons/fa';
import toast from 'react-hot-toast';

const CreatePostModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { createPost } = usePost();

  const onDrop = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: true
  });

  const removeImage = (index) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      return newImages;
    });
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error('En az bir resim seçmelisiniz');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you would upload images to a cloud service first
      const imageUrls = images.map(img => img.preview); // Mock URLs
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const postData = {
        images: imageUrls,
        caption,
        location,
        tags: tagArray
      };

      const result = await createPost(postData);
      if (result.success) {
        onClose();
        setStep(1);
        setImages([]);
        setCaption('');
        setLocation('');
        setTags('');
      }
    } catch (error) {
      console.error('Create post error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes size={20} />
          </button>
          <h2 className="text-lg font-semibold">Yeni Gönderi</h2>
          {step === 2 && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-blue-500 font-semibold hover:text-blue-600 disabled:opacity-50"
            >
              {loading ? 'Paylaşılıyor...' : 'Paylaş'}
            </button>
          )}
        </div>

        <div className="flex">
          {/* Left side - Image upload/preview */}
          <div className="w-1/2 border-r border-gray-200">
            {step === 1 ? (
              <div className="p-6">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FaImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Fotoğraflarınızı buraya sürükleyin
                  </p>
                  <p className="text-gray-500">
                    veya seçmek için tıklayın
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4">
                {images.length > 0 && (
                  <div className="space-y-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side - Form */}
          <div className="w-1/2 p-4">
            {step === 1 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Gönderi Detayları</h3>
                <p className="text-gray-500 text-sm">
                  Gönderiniz için açıklama, konum ve etiketler ekleyebilirsiniz.
                </p>
                <button
                  onClick={() => setStep(2)}
                  disabled={images.length === 0}
                  className="w-full btn btn-primary disabled:opacity-50"
                >
                  Devam Et
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User info */}
                <div className="flex items-center space-x-3">
                  <img
                    src="https://via.placeholder.com/32"
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-semibold">username</span>
                </div>

                {/* Caption */}
                <div>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Gönderiniz için açıklama yazın..."
                    className="w-full border-none outline-none resize-none"
                    rows={4}
                    maxLength={2200}
                  />
                  <div className="text-right text-xs text-gray-500">
                    {caption.length}/2200
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Konum ekle"
                    className="flex-1 border-none outline-none"
                  />
                </div>

                {/* Tags */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <FaTag className="text-gray-400" />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Etiketler (virgülle ayırın)"
                    className="flex-1 border-none outline-none"
                  />
                </div>

                {/* Privacy settings */}
                <div className="space-y-2">
                  <h4 className="font-medium">Gizlilik</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Yorumlara izin ver</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Beğenilere izin ver</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;