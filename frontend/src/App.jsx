/**
 * PersonalityMatch - Modern UI Demo
 * Showcasing responsive design system
 */

import { useState } from 'react';
import Button from './components/Button';
import Card from './components/Card';
import Input from './components/Input';
import Spinner from './components/Spinner';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="app">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content animate-fade-in">
            <h1 className="hero-title">
              Find Your Perfect
              <span className="gradient-text"> Personality Match</span>
            </h1>
            <p className="hero-subtitle">
              Discover meaningful connections through advanced personality compatibility analysis
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button variant="primary" size="lg">
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="text-center">Why PersonalityMatch?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card gradient className="animate-fade-in">
              <div className="feature-icon">🎯</div>
              <h3>Accurate Matching</h3>
              <p>Advanced algorithm based on Big Five personality model</p>
            </Card>

            <Card gradient className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="feature-icon">🔒</div>
              <h3>Privacy First</h3>
              <p>Your data is encrypted and never shared with third parties</p>
            </Card>

            <Card gradient className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="feature-icon">⚡</div>
              <h3>Fast & Easy</h3>
              <p>Complete the questionnaire in under 10 minutes</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Form Section */}
      <section className="demo-section">
        <div className="container container-md">
          <Card
            header={<h2>Try It Out</h2>}
            footer={
              <div className="flex gap-4">
                <Button variant="primary" type="submit" loading={loading} onClick={handleSubmit}>
                  {loading ? 'Processing...' : 'Submit'}
                </Button>
                <Button variant="ghost">
                  Cancel
                </Button>
              </div>
            }
          >
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </form>
          </Card>
        </div>
      </section>

      {/* Component Showcase */}
      <section className="showcase-section">
        <div className="container">
          <h2 className="text-center">Component Showcase</h2>

          {/* Buttons */}
          <div className="showcase-group">
            <h3>Buttons</h3>
            <div className="flex gap-4 flex-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="showcase-group">
            <h3>Button Sizes</h3>
            <div className="flex gap-4 items-center flex-wrap">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" size="xl">Extra Large</Button>
            </div>
          </div>

          {/* Loading States */}
          <div className="showcase-group">
            <h3>Loading States</h3>
            <div className="flex gap-6 items-center flex-wrap">
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" />
              <Spinner size="xl" />
            </div>
          </div>

          {/* Skeleton Loading */}
          <div className="showcase-group">
            <h3>Skeleton Loading</h3>
            <div className="flex flex-col gap-3">
              <div className="skeleton" style={{ height: '2rem', width: '60%' }} />
              <div className="skeleton" style={{ height: '1rem', width: '100%' }} />
              <div className="skeleton" style={{ height: '1rem', width: '80%' }} />
            </div>
          </div>

          {/* Typography */}
          <div className="showcase-group">
            <h3>Typography</h3>
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <h4>Heading 4</h4>
            <p>This is a paragraph with <strong>bold text</strong>, <em>italic text</em>, and <code>inline code</code>.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container text-center">
          <p>&copy; 2024 PersonalityMatch. Built with ❤️ using modern web technologies.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
