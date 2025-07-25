'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import CategoryManager from '../components/CategoryManager';

export default function DashboardPage() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);

    const [formMode, setFormMode] = useState('create');
    const [editingArticleId, setEditingArticleId] = useState(null);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [status, setStatus] = useState('Draft');
    
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');

    const [articleLoading, setArticleLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchArticles = async () => {
        try {
            setArticleLoading(true);
            setError('');
            
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (categoryFilter) params.category = categoryFilter;
            if (dateFromFilter) params.date_from = dateFromFilter;
            if (dateToFilter) params.date_to = dateToFilter;

            const { data } = await api.get('/articles', { params });
            setArticles(data.data || data);
        } catch (error) { 
            setError('Failed to fetch articles');
            console.error('Failed to fetch articles', error.response?.data); 
        } finally {
            setArticleLoading(false);
        }
    };

    const fetchCategories = async () => {
        if(user?.role === 'admin') {
            try {
                const { data } = await api.get('/categories');
                setCategories(data.data || data);
            } catch (error) { 
                console.error('Failed to fetch categories', error.response?.data); 
            }
        }
    };

    useEffect(() => {
        if (!loading && !user) router.push('/');
        if (user) {
            fetchArticles();
            fetchCategories();
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            fetchArticles();
        }
    }, [statusFilter, categoryFilter, dateFromFilter, dateToFilter]);

    const resetForm = () => {
        setTitle('');
        setContent('');
        setSelectedCategories([]);
        setStatus('Draft');
        setEditingArticleId(null);
        setFormMode('create');
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }

        if (content.length < 10) {
            setError('Content must be at least 10 characters long');
            return;
        }
        
        const articleData = { 
            title: title.trim(), 
            content: content.trim(), 
            status: status
        };

        if (user?.role === 'admin' && selectedCategories.length > 0) {
            articleData.category_ids = selectedCategories.map(id => parseInt(id));
        }

        console.log('Submitting article data:', articleData);

        try {
            setArticleLoading(true);
            
            if (formMode === 'create') {
                const response = await api.post('/articles', articleData);
                console.log('Article created:', response.data);
                setSuccess('Article created successfully! AI is processing slug and summary...');
            } else {
                const response = await api.put(`/articles/${editingArticleId}`, articleData);
                console.log('Article updated:', response.data);
                setSuccess('Article updated successfully!');
            }
            
            resetForm();
            fetchArticles();
        } catch (error) { 
            const errorMsg = error.response?.data?.message || 'Failed to save article';
            setError(errorMsg);
            console.error('Failed to save article', error.response?.data || error.message);
        } finally {
            setArticleLoading(false);
        }
    };

    const handleDeleteArticle = async (articleId) => {
        if (window.confirm('Are you sure you want to delete this article?')) {
            try {
                await api.delete(`/articles/${articleId}`);
                setSuccess('Article deleted successfully');
                fetchArticles();
            } catch (error) { 
                setError('Failed to delete article');
                console.error('Failed to delete article', error.response?.data); 
            }
        }
    };

    const handleEditClick = (article) => {
        setFormMode('edit');
        setEditingArticleId(article.id);
        setTitle(article.title);
        setContent(article.content);
        setStatus(article.status);
        
        if (user?.role === 'admin' && article.categories) {
            setSelectedCategories(article.categories.map(cat => cat.id.toString()));
        }
        
        setError('');
        setSuccess('');
        window.scrollTo(0, 0);
    };

    const clearFilters = () => {
        setStatusFilter('');
        setCategoryFilter('');
        setDateFromFilter('');
        setDateToFilter('');
    };

    if (loading) return <p>Loading...</p>;
    if (!user) return null;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Welcome, {user.name}! ({user.role})</h1>
                <button onClick={logout}>Logout</button>
            </div>
            <hr />

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

            {/* Category Manager for Admins */}
            <CategoryManager user={user} />

            {/* Article Form */}
            <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px', 
                marginBottom: '30px' 
            }}>
                <h2>{formMode === 'create' ? 'Create New Article' : 'Edit Article'}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            required 
                            placeholder="Article title (required)"
                            style={{ width: '100%' }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <textarea 
                            value={content} 
                            onChange={(e) => setContent(e.target.value)} 
                            required 
                            placeholder="Article content (minimum 10 characters)"
                            minLength="10"
                            rows="6"
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Status:</label>
                        <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="Draft">Draft</option>
                            {user?.role === 'admin' && <option value="Published">Published</option>}
                            {user?.role === 'admin' && <option value="Archived">Archived</option>}
                        </select>
                        {user?.role === 'author' && (
                            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                                Authors can only save as Draft. Admin approval required for publishing.
                            </small>
                        )}
                    </div>

                    {user.role === 'admin' && categories.length > 0 && (
                        <div style={{ marginBottom: '15px' }}>
                            <label>Categories (hold Ctrl/Cmd to select multiple):</label>
                            <select 
                                multiple 
                                value={selectedCategories} 
                                onChange={(e) => setSelectedCategories(Array.from(e.target.selectedOptions, option => option.value))}
                                style={{ width: '100%', minHeight: '80px' }}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <button 
                            type="submit" 
                            disabled={articleLoading}
                            style={{ marginRight: '10px' }}
                        >
                            {articleLoading ? 'Saving...' : (formMode === 'create' ? 'Create Article' : 'Update Article')}
                        </button>
                        
                        {formMode === 'edit' && (
                            <button type="button" onClick={resetForm}>
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Article List with Filters */}
            <div>
                <h2>Your Articles</h2>
                
                {/* Advanced Filters */}
                <div style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '15px', 
                    borderRadius: '5px', 
                    marginBottom: '20px' 
                }}>
                    <h4 style={{ marginTop: '0' }}>Filters</h4>
                    
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '15px',
                        marginBottom: '15px'
                    }}>
                        <div>
                            <label>Status:</label>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ width: '100%' }}
                            >
                                <option value="">All Statuses</option>
                                <option value="Draft">Draft</option>
                                <option value="Published">Published</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>

                        {user?.role === 'admin' && categories.length > 0 && (
                            <div>
                                <label>Category:</label>
                                <select 
                                    value={categoryFilter} 
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label>From Date:</label>
                            <input 
                                type="date" 
                                value={dateFromFilter} 
                                onChange={(e) => setDateFromFilter(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div>
                            <label>To Date:</label>
                            <input 
                                type="date" 
                                value={dateToFilter} 
                                onChange={(e) => setDateToFilter(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <button 
                        onClick={clearFilters}
                        style={{ 
                            backgroundColor: '#6c757d', 
                            color: 'white',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Clear All Filters
                    </button>
                </div>

                {/* Articles List */}
                {articleLoading ? (
                    <p>Loading articles...</p>
                ) : articles.length === 0 ? (
                    <p style={{ color: '#666' }}>
                        {statusFilter || categoryFilter || dateFromFilter || dateToFilter 
                            ? 'No articles match your filters.' 
                            : 'No articles found. Create your first article above.'
                        }
                    </p>
                ) : (
                    <ul>
                        {articles.map(article => (
                            <li key={article.id}>
                                <div>
                                    <strong>{article.title}</strong>
                                    {article.slug && (
                                        <>
                                            <br />
                                            <small style={{ color: '#666' }}>Slug: {article.slug}</small>
                                        </>
                                    )}
                                    <br />
                                    <small>Status: <strong>{article.status}</strong></small>
                                    
                                    {article.summary && (
                                        <>
                                            <br />
                                            <small style={{ color: '#555' }}>
                                                Summary: {article.summary}
                                            </small>
                                        </>
                                    )}
                                    
                                    {article.categories && article.categories.length > 0 && (
                                        <>
                                            <br />
                                            <small>Categories: {article.categories.map(cat => cat.name).join(', ')}</small>
                                        </>
                                    )}
                                    
                                    {article.published_at && (
                                        <>
                                            <br />
                                            <small>Published: {new Date(article.published_at).toLocaleDateString()}</small>
                                        </>
                                    )}
                                    
                                    <br />
                                    <small style={{ color: '#999' }}>
                                        Created: {new Date(article.created_at).toLocaleDateString()}
                                        {article.author && ` by ${article.author.name}`}
                                    </small>
                                </div>
                                <div>
                                    <button onClick={() => handleEditClick(article)}>Edit</button>
                                    <button onClick={() => handleDeleteArticle(article.id)}>Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}