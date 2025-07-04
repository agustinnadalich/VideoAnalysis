import React, { useState } from 'react';
import { uploadFile } from '../services/api';

const FileUpload = ({ onUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedFile) {
            try {
                await uploadFile(selectedFile);
                alert('File uploaded successfully!');
                onUpload(selectedFile.name); // Llama a la función onUpload después de una subida exitosa
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('Failed to upload file.');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleFileChange} />
            <button type="submit">Upload</button>
        </form>
    );
};

export default FileUpload;