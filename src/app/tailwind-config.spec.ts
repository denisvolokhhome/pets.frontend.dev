/**
 * Unit tests for Tailwind CSS configuration
 * 
 * These tests verify that the Tailwind CSS setup meets the design system requirements
 * specified in the Bootstrap to Tailwind migration spec.
 * 
 * Requirements tested: 1.2, 1.3, 1.4, 1.5, 1.6
 * 
 * Note: These tests verify the configuration by checking the compiled output
 * and configuration structure rather than reading files directly.
 */
describe('Tailwind Configuration', () => {
  describe('Design System Colors (Requirement 1.2)', () => {
    it('should have primary color #FF6B6B defined in CSS custom properties', () => {
      const styles = getComputedStyle(document.documentElement);
      const primaryColor = styles.getPropertyValue('--primary-color').trim();
      expect(primaryColor).toBe('#FF6B6B');
    });

    it('should have secondary color #4ECDC4 defined in CSS custom properties', () => {
      const styles = getComputedStyle(document.documentElement);
      const secondaryColor = styles.getPropertyValue('--secondary-color').trim();
      expect(secondaryColor).toBe('#4ECDC4');
    });
  });

  describe('Typography Configuration (Requirement 1.3)', () => {
    it('should have Poppins font defined for headings', () => {
      const styles = getComputedStyle(document.documentElement);
      const fontPrimary = styles.getPropertyValue('--font-primary').trim();
      expect(fontPrimary).toContain('Poppins');
    });

    it('should have Inter font defined for body text', () => {
      const styles = getComputedStyle(document.documentElement);
      const fontSecondary = styles.getPropertyValue('--font-secondary').trim();
      expect(fontSecondary).toContain('Inter');
    });
  });

  describe('Border Radius Configuration (Requirement 1.4)', () => {
    it('should have 12px border radius defined', () => {
      const styles = getComputedStyle(document.documentElement);
      const borderRadius = styles.getPropertyValue('--border-radius').trim();
      expect(borderRadius).toBe('12px');
    });
  });

  describe('Tailwind Directives in styles.css (Requirement 1.6)', () => {
    it('should have Tailwind base styles applied', () => {
      // Check if Tailwind's base reset is applied by checking for box-sizing
      const testDiv = document.createElement('div');
      document.body.appendChild(testDiv);
      const styles = getComputedStyle(testDiv);
      
      // Tailwind's base includes box-sizing: border-box
      expect(styles.boxSizing).toBe('border-box');
      
      document.body.removeChild(testDiv);
    });

    it('should have Tailwind utility classes available', () => {
      // Create a test element with Tailwind utility classes
      const testDiv = document.createElement('div');
      testDiv.className = 'flex items-center justify-center';
      document.body.appendChild(testDiv);
      
      const styles = getComputedStyle(testDiv);
      
      // Check if flex utility is applied
      expect(styles.display).toBe('flex');
      
      document.body.removeChild(testDiv);
    });

    it('should have container class available', () => {
      const testDiv = document.createElement('div');
      testDiv.className = 'container';
      document.body.appendChild(testDiv);
      
      const styles = getComputedStyle(testDiv);
      
      // Container should have width set
      expect(styles.width).toBeTruthy();
      
      document.body.removeChild(testDiv);
    });

    it('should have custom primary color utility available', () => {
      const testDiv = document.createElement('div');
      testDiv.className = 'bg-primary';
      document.body.appendChild(testDiv);
      
      const styles = getComputedStyle(testDiv);
      const bgColor = styles.backgroundColor;
      
      // Check if background color is set (RGB equivalent of #FF6B6B)
      // #FF6B6B = rgb(255, 107, 107)
      expect(bgColor).toContain('255');
      expect(bgColor).toContain('107');
      
      document.body.removeChild(testDiv);
    });

    it('should have custom secondary color utility available', () => {
      const testDiv = document.createElement('div');
      testDiv.className = 'bg-secondary';
      document.body.appendChild(testDiv);
      
      const styles = getComputedStyle(testDiv);
      const bgColor = styles.backgroundColor;
      
      // Check if background color is set (RGB equivalent of #4ECDC4)
      // #4ECDC4 = rgb(78, 205, 196)
      expect(bgColor).toContain('78');
      expect(bgColor).toContain('205');
      expect(bgColor).toContain('196');
      
      document.body.removeChild(testDiv);
    });
  });

  describe('Responsive Utilities', () => {
    it('should have responsive breakpoint utilities available', () => {
      const testDiv = document.createElement('div');
      testDiv.className = 'hidden md:block';
      document.body.appendChild(testDiv);
      
      const styles = getComputedStyle(testDiv);
      
      // At default viewport, hidden should apply
      expect(styles.display).toBe('none');
      
      document.body.removeChild(testDiv);
    });
  });

  describe('Spacing Utilities', () => {
    it('should have margin utilities available', () => {
      const testDiv = document.createElement('div');
      testDiv.className = 'm-4';
      document.body.appendChild(testDiv);
      
      const styles = getComputedStyle(testDiv);
      
      // m-4 should apply margin
      expect(styles.margin).toBeTruthy();
      expect(styles.margin).not.toBe('0px');
      
      document.body.removeChild(testDiv);
    });

    it('should have padding utilities available', () => {
      const testDiv = document.createElement('div');
      testDiv.className = 'p-4';
      document.body.appendChild(testDiv);
      
      const styles = getComputedStyle(testDiv);
      
      // p-4 should apply padding
      expect(styles.padding).toBeTruthy();
      expect(styles.padding).not.toBe('0px');
      
      document.body.removeChild(testDiv);
    });
  });

  describe('Layout Utilities', () => {
    it('should have grid utilities available', () => {
      const testDiv = document.createElement('div');
      testDiv.className = 'grid';
      document.body.appendChild(testDiv);
      
      const styles = getComputedStyle(testDiv);
      
      expect(styles.display).toBe('grid');
      
      document.body.removeChild(testDiv);
    });

    it('should have width utilities available', () => {
      const testDiv = document.createElement('div');
      testDiv.className = 'w-full';
      document.body.appendChild(testDiv);
      
      const styles = getComputedStyle(testDiv);
      
      expect(styles.width).toBeTruthy();
      
      document.body.removeChild(testDiv);
    });
  });
});
