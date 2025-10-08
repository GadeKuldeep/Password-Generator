import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./Vault.css"

const Vault = () => {
  const [vaultItems, setVaultItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: ''
  });
  const [editingItem, setEditingItem] = useState(null);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);

  // Password Generator State
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeLookAlikes, setExcludeLookAlikes] = useState(true);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: '/api',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add request interceptor to include auth token
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle auth errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        handleUnauthorized();
      }
      return Promise.reject(error);
    }
  );

  const handleUnauthorized = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Fetch vault items on component mount
  useEffect(() => {
    fetchVaultItems();
  }, []);

  const fetchVaultItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vault');
      setVaultItems(response.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Please log in to access your vault');
      } else {
        setError('Failed to fetch vault items');
        console.error('Error fetching vault items:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Password Generator Functions
  const generateRandomPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const lookAlikes = '0OIl1';
    
    let charset = lowercase + uppercase;
    
    if (includeNumbers) {
      charset += numbers;
    }
    if (includeSymbols) {
      charset += symbols;
    }
    
    if (excludeLookAlikes) {
      charset = charset.split('').filter(char => !lookAlikes.includes(char)).join('');
    }
    
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    // Ensure password has at least one lowercase and one uppercase
    if (!password.match(/[a-z]/)) {
      const randomLower = lowercase[Math.floor(Math.random() * lowercase.length)];
      password = randomLower + password.slice(1);
    }
    if (!password.match(/[A-Z]/)) {
      const randomUpper = uppercase[Math.floor(Math.random() * uppercase.length)];
      password = password.slice(0, -1) + randomUpper;
    }
    
    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setGeneratedPassword(newPassword);
  };

  const handleUseGeneratedPassword = () => {
    setFormData(prev => ({
      ...prev,
      password: generatedPassword
    }));
    setShowPasswordGenerator(false);
  };

  const handleCopyGeneratedPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      alert('Password copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter items based on search query
  const filteredItems = vaultItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Encryption function using Web Crypto API
  const encryptData = async (data, masterPassword) => {
    try {
      // Convert master password to key
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(masterPassword),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      // Encrypt each field
      const encryptField = async (field) => {
        const encoded = encoder.encode(field);
        const encrypted = await window.crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: iv
          },
          key,
          encoded
        );
        
        return {
          ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
          iv: btoa(String.fromCharCode(...iv)),
          salt: btoa(String.fromCharCode(...salt)),
          authTag: btoa(String.fromCharCode(...new Uint8Array(encrypted).slice(-16)))
        };
      };

      const encryptedTitle = await encryptField(data.title);
      const encryptedUsername = await encryptField(data.username || '');
      const encryptedPassword = await encryptField(data.password);
      const encryptedUrl = await encryptField(data.url || '');
      const encryptedNotes = await encryptField(data.notes || '');

      return {
        title: encryptedTitle.ciphertext,
        username: encryptedUsername.ciphertext,
        password: encryptedPassword.ciphertext,
        url: encryptedUrl.ciphertext,
        notes: encryptedNotes.ciphertext,
        iv: encryptedTitle.iv, // Using same IV for all fields for simplicity
        authTag: encryptedTitle.authTag
      };

    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.password) {
      setError('Title and password are required');
      return;
    }

    try {
      setLoading(true);
      
      // Get master password from user (in real app, this would be from login)
      const masterPassword = prompt('Enter your master password to encrypt:');
      if (!masterPassword) {
        setError('Master password is required');
        return;
      }

      // Encrypt the data before sending to server
      const encryptedData = await encryptData(formData, masterPassword);

      if (editingItem) {
        // Update existing item
        await api.put(`/vault/${editingItem._id}`, encryptedData);
        setEditingItem(null);
      } else {
        // Create new item
        await api.post('/vault', encryptedData);
      }
      
      // Reset form and refresh list
      setFormData({ 
        title: '', 
        username: '', 
        password: '', 
        url: '', 
        notes: '' 
      });
      await fetchVaultItems();
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to save vault item');
        console.error('Error saving vault item:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    // Note: In production, you'd need to decrypt the data here
    // For demo, we'll show placeholder values
    setFormData({
      title: '[Encrypted]',
      username: '[Encrypted]',
      password: '[Encrypted]',
      url: '[Encrypted]',
      notes: '[Encrypted]'
    });
    setError('Note: Editing encrypted items requires decryption. This is a demo view.');
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setFormData({ 
      title: '', 
      username: '', 
      password: '', 
      url: '', 
      notes: '' 
    });
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/vault/${id}`);
      await fetchVaultItems();
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to delete vault item');
        console.error('Error deleting vault item:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async (item) => {
    try {
      // Note: In production, you'd decrypt the password here
      // For demo, we'll show a message
      alert('In production, this would decrypt and copy the password. Demo mode: Password copying simulated.',item);
      
      // Simulate copy feedback
      const originalText = event.target.textContent;
      event.target.textContent = 'Copied!';
      setTimeout(() => {
        event.target.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
      setError('Failed to copy to clipboard');
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!getAuthToken();
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated()) {
    return (
      <div className="vault-container">
        <h1>Password Vault</h1>
        <div className="error-message">
          Please log in to access your vault.
        </div>
        <button 
          onClick={() => window.location.href = '/login'}
          className="login-redirect-btn"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="vault-container">
      <h1>Password Vault</h1>
      
      {/* Password Generator */}
      {showPasswordGenerator && (
        <div className="password-generator-modal">
          <div className="generator-content">
            <h3>Generate Strong Password</h3>
            <div className="generator-controls">
              <div className="control-group">
                <label>Length: {length}</label>
                <input 
                  type="range" 
                  min="8" 
                  max="32" 
                  value={length} 
                  onChange={(e) => setLength(parseInt(e.target.value))}
                />
              </div>
              <div className="control-group checkboxes">
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeNumbers} 
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                  />
                  Include Numbers
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={includeSymbols} 
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                  />
                  Include Symbols
                </label>
                <label>
                  <input 
                    type="checkbox" 
                    checked={excludeLookAlikes} 
                    onChange={(e) => setExcludeLookAlikes(e.target.checked)}
                  />
                  Exclude Look-alikes
                </label>
              </div>
            </div>
            
            <button onClick={handleGeneratePassword} className="generate-btn">
              Generate Password
            </button>
            
            {generatedPassword && (
              <div className="generated-password-section">
                <div className="password-display">
                  <strong>Generated Password:</strong>
                  <code>{generatedPassword}</code>
                </div>
                <div className="password-actions">
                  <button onClick={handleCopyGeneratedPassword} className="copy-btn">
                    Copy
                  </button>
                  <button onClick={handleUseGeneratedPassword} className="use-btn">
                    Use This Password
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setShowPasswordGenerator(false)}
              className="close-generator"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="vault-form">
        <h2>{editingItem ? 'Edit Item' : 'Add New Password'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Gmail, GitHub"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="username">Username/Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username or email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="password-input-group">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPasswordGenerator(true)}
                className="generate-password-btn"
              >
                Generate
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="url">Website URL</label>
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes"
              rows="3"
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

      {/* Search and Vault Items List */}
      <div className="vault-items">
        <div className="vault-header">
          <h2>Your Passwords ({vaultItems.length})</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by title, username, or URL..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {loading && !vaultItems.length ? (
          <div className="loading">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="no-items">
            {searchQuery ? 'No matching items found' : 'No passwords saved yet. Add your first password above!'}
          </div>
        ) : (
          <div className="items-list">
            {filteredItems.map((item) => (
              <div key={item._id} className="vault-item">
                <div className="item-content">
                  <div className="item-main">
                    <h3>{item.title}</h3>
                    <div className="item-details">
                      {item.username && (
                        <div className="item-field">
                          <strong>Username:</strong>
                          <span>{item.username}</span>
                        </div>
                      )}
                      <div className="item-field password-field">
                        <strong>Password:</strong>
                        <span className="password-mask">••••••••</span>
                        <button 
                          onClick={() => handleCopyPassword(item)}
                          className="copy-btn"
                          type="button"
                        >
                          Copy
                        </button>
                      </div>
                      {item.url && (
                        <div className="item-field">
                          <strong>URL:</strong>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            {item.url}
                          </a>
                        </div>
                      )}
                      {item.notes && (
                        <div className="item-field">
                          <strong>Notes:</strong>
                          <span>{item.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="item-meta">
                    <small>Updated: {new Date(item.updatedAt).toLocaleDateString()}</small>
                  </div>
                </div>
                <div className="item-actions">
                  <button 
                    onClick={() => handleEdit(item)}
                    disabled={loading}
                    className="edit-btn"
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