// File: app/components/CategoryManager.js

'use client';

import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function CategoryManager({ user }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    
    // Form fields
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Only show if user is admin
    if (user?.role !== 'admin') {
        return null;
    }

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/categories');
            setCategories(data.data || data);
        } catch (error) {
            setError('Failed to fetch categories');
            console.error('Failed to fetch categories', error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const resetForm = () => {
        setName('');
        setDescription('');
        setEditingCategoryId(null);
        setFormMode('create');
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim()) {
            setError('Category name is required');
            return;
        }

        try {
            const categoryData = { 
                name: name.trim(),
                description: description.trim() 
            };

            if (formMode === 'create') {
                await api.post('/categories', categoryData);
                setSuccess('Category created successfully!');
            } else {
                await api.put(`/categories/${editingCategoryId}`, categoryData);
                setSuccess('Category updated successfully!');
            }
            
            resetForm();
            fetchCategories();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to save category';
            setError(errorMsg);
            console.error('Failed to save category', error.response?.data);
        }
    };

    const handleEdit = (category) => {
        setFormMode('edit');
        setEditingCategoryId(category.id);
        setName(category.name);
        setDescription(category.description || '');
        setError('');
        setSuccess('');
    };

    const handleDelete = async (categoryId, categoryName) => {
        if (window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/categories/${categoryId}`);
                setSuccess('Category deleted successfully!');
                fetchCategories();
            } catch (error) {
                const errorMsg = error.response?.data?.message || 'Failed to delete category';
                setError(errorMsg);
                console.error('Failed to delete category', error.response?.data);
            }
        }
    };

    return (
        <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '20px', 
            marginBottom: '30px',
            backgroundColor: '#f9f9f9'
        }}>
            <h2>Category Management</h2>
            
            {/* Success/Error Messages */}
            {success && (
                <div style={{ 
                    backgroundColor: '#d4edda', 
                    color: '#155724', 
                    padding: '10px', 
                    borderRadius: '4px', 
                    marginBottom: '15px' 
                }}>
                    {success}
                </div>
            )}
            
            {error && (
                <div style={{ 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24', 
                    padding: '10px', 
                    borderRadius: '4px', 
                    marginBottom: '15px' 
                }}>
                    {error}
                </div>
            )}

            {/* Category Form */}
            <div style={{ marginBottom: '30px' }}>
                <h3>{formMode === 'create' ? 'Create New Category' : 'Edit Category'}</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Category name (required)"
                            required
                            style={{ width: '100%' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Category description (optional)"
                            rows="3"
                            style={{ width: '100%' }}
                        />
                    </div>
                    
                    <div>
                        <button type="submit" style={{ marginRight: '10px' }}>
                            {formMode === 'create' ? 'Create Category' : 'Update Category'}
                        </button>
                        
                        {formMode === 'edit' && (
                            <button type="button" onClick={resetForm}>
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Categories List */}
            <div>
                <h3>Existing Categories</h3>
                
                {loading ? (
                    <p>Loading categories...</p>
                ) : categories.length === 0 ? (
                    <p style={{ color: '#666' }}>No categories found. Create your first category above.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {categories.map(category => (
                            <div 
                                key={category.id} 
                                style={{ 
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    padding: '15px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 5px 0' }}>{category.name}</h4>
                                    {category.description && (
                                        <p style={{ margin: '0', color: '#666', fontSize: '0.9em' }}>
                                            {category.description}
                                        </p>
                                    )}
                                    <small style={{ color: '#999' }}>
                                        Slug: {category.slug}
                                    </small>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button 
                                        onClick={() => handleEdit(category)}
                                        style={{ 
                                            backgroundColor: '#ffc107', 
                                            color: 'black',
                                            border: 'none',
                                            padding: '5px 10px',
                                            borderRadius: '3px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleDelete(category.id, category.name)}
                                        style={{ 
                                            backgroundColor: '#dc3545', 
                                            color: 'white',
                                            border: 'none',
                                            padding: '5px 10px',
                                            borderRadius: '3px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}