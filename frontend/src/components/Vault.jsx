import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Vault.css"

const Vault = () => {
  const [vaultItems, setVaultItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    ciphertext: '',
    iv: '',
    salt: ''
  });
  const [editingItem, setEditingItem] = useState(null);

  // Fetch vault items on component mount
  useEffect(() => {
    fetchVaultItems();
  }, []);

  const fetchVaultItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/vault');
      setVaultItems(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch vault items');
      console.error('Error fetching vault items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.ciphertext || !formData.iv || !formData.salt) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      if (editingItem) {
        // Update existing item
        await axios.put(`/api/vault/${editingItem._id}`, formData);
        setEditingItem(null);
      } else {
        // Create new item
        await axios.post('/api/vault', formData);
      }
      
      // Reset form and refresh list
      setFormData({ ciphertext: '', iv: '', salt: '' });
      await fetchVaultItems();
      setError('');
    } catch (err) {
      setError('Failed to save vault item');
      console.error('Error saving vault item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ciphertext: item.ciphertext,
      iv: item.iv,
      salt: item.salt
    });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setFormData({ ciphertext: '', iv: '', salt: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/vault/${id}`);
      await fetchVaultItems();
      setError('');
    } catch (err) {
      setError('Failed to delete vault item');
      console.error('Error deleting vault item:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vault-container">
      <h1>Vault Manager</h1>
      
      {/* Add/Edit Form */}
      <div className="vault-form">
        <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ciphertext">Ciphertext:</label>
            <textarea
              id="ciphertext"
              name="ciphertext"
              value={formData.ciphertext}
              onChange={handleInputChange}
              placeholder="Enter encrypted ciphertext"
              rows="3"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="iv">Initialization Vector (IV):</label>
            <input
              type="text"
              id="iv"
              name="iv"
              value={formData.iv}
              onChange={handleInputChange}
              placeholder="Enter IV"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="salt">Salt:</label>
            <input
              type="text"
              id="salt"
              name="salt"
              value={formData.salt}
              onChange={handleInputChange}
              placeholder="Enter salt"
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
            </button>
            {editingItem && (
              <button type="button" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Vault Items List */}
      <div className="vault-items">
        <h2>Your Vault Items</h2>
        {loading && !vaultItems.length ? (
          <div className="loading">Loading...</div>
        ) : vaultItems.length === 0 ? (
          <div className="no-items">No vault items found</div>
        ) : (
          <div className="items-list">
            {vaultItems.map((item) => (
              <div key={item._id} className="vault-item">
                <div className="item-content">
                  <div className="item-field">
                    <strong>Ciphertext:</strong>
                    <code>{item.ciphertext.substring(0, 50)}...</code>
                  </div>
                  <div className="item-field">
                    <strong>IV:</strong>
                    <code>{item.iv}</code>
                  </div>
                  <div className="item-field">
                    <strong>Salt:</strong>
                    <code>{item.salt}</code>
                  </div>
                  <div className="item-meta">
                    <small>Created: {new Date(item.createdAt).toLocaleDateString()}</small>
                    <small>Updated: {new Date(item.updatedAt).toLocaleDateString()}</small>
                  </div>
                </div>
                <div className="item-actions">
                  <button 
                    onClick={() => handleEdit(item)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item._id)}
                    disabled={loading}
                    className="delete-btn"
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
};

export default Vault;
