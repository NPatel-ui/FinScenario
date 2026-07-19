import React, { useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingLabelInputProps {
  label: string;
  type?: string;
  id?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  autoFocus?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  type = 'text',
  id,
  required = false,
  value,
  onChange,
  error,
  autoFocus = false,
}) => {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className="floating-input-group">
      <input
        type={type}
        id={inputId}
        required={required}
        placeholder={label}
        value={value}
        onChange={onChange}
        className={error ? 'error' : ''}
        autoFocus={autoFocus}
      />
      <label htmlFor={inputId}>{label}</label>
      <AnimatePresence>
        {error && (
          <motion.span
            className="error-message"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingLabelInput;
