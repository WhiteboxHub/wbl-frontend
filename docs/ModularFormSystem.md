# Modular Form System

This document explains how to use the new modular and reusable form system that replaces individual add forms across all pages.

## Overview

The new system consists of two main components:

1. **FormModal** - A unified modal component that handles both add and edit operations
2. **useFormModal** - A custom hook that manages form state and API operations

## Key Benefits

- ✅ **No Code Duplication**: Single form component for all entity types
- ✅ **Consistent UI**: Same form styling and behavior across all pages
- ✅ **Dynamic Field Rendering**: Automatically displays relevant fields based on entity type
- ✅ **Easy Integration**: Simple hook-based API for any page
- ✅ **Type Safety**: Full TypeScript support with proper typing

## How It Works

### 1. FormModal Component

The `FormModal` component automatically:
- Renders appropriate form fields based on the `entityType`
- Handles field validation and formatting
- Supports different field types (text, select, date, textarea, etc.)
- Organizes fields into logical sections
- Provides rich text editing for notes

### 2. useFormModal Hook

The `useFormModal` hook provides:
- Modal state management (open/close)
- Add/Edit mode switching
- API integration (POST/PUT requests)
- Success/error handling
- Form data management

## Usage Examples

### Basic Usage

```tsx
import { useFormModal } from "@/hooks/useFormModal";
import { FormModal } from "@/components/FormModal";

export default function MyPage() {
  const { 
    isModalOpen, 
    openAddModal, 
    openEditModal, 
    closeModal, 
    handleSave, 
    modalData, 
    modalTitle, 
    modalMode, 
    entityType, 
    batches 
  } = useFormModal({
    entityType: 'vendor', // or 'candidate', 'lead', etc.
    apiEndpoint: '/vendors',
    onSuccess: () => {
      // Refresh your data here
      console.log('Operation successful!');
    }
  });

  return (
    <div>
      <button onClick={openAddModal}>Add New Vendor</button>
      
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        data={modalData}
        title={modalTitle}
        onSave={handleSave}
        batches={batches}
        mode={modalMode}
        entityType={entityType}
      />
    </div>
  );
}
```

### With Edit Functionality

```tsx
// In your table/list component
const handleEditVendor = (vendor) => {
  openEditModal(vendor);
};

// The FormModal will automatically populate with vendor data
```

## Supported Entity Types

The system supports the following entity types:

- `vendor` - Vendor management
- `candidate` - Candidate management  
- `lead` - Lead management
- `employee` - Employee management
- `interview` - Interview scheduling
- `marketing` - Marketing campaigns
- `placement` - Job placements
- `preparation` - Candidate preparation
- `course-material` - Course materials
- `course-subject` - Course subjects
- `batch` - Batch management

## Field Configuration

Each entity type has predefined field configurations:

### Default Form Data
Each entity type has default values for add operations:

```tsx
// Example for vendor
const defaultFormData = {
  vendor: {
    full_name: "",
    email: "",
    phone_number: "",
    type: "client",
    status: "active",
    // ... more fields
  }
};
```

### Field Sections
Fields are automatically organized into sections:
- Basic Information
- Professional Information  
- Contact Information
- Emergency Contact
- Notes

### Field Types
The system automatically detects and renders appropriate field types:
- Text inputs
- Email inputs
- Phone inputs
- Date pickers
- Select dropdowns
- Textareas
- Rich text editors (for notes)

## Migration Guide

### Before (Old Way)
```tsx
// Each page had its own form implementation
const [isModalOpen, setIsModalOpen] = useState(false);
const [formData, setFormData] = useState(initialFormData);

const onSubmit = async (data) => {
  // Custom form submission logic
  const response = await apiFetch("/vendors", {
    method: "POST",
    body: data,
  });
  // Handle response...
};

// Custom form JSX
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register("full_name")} />
  <input {...register("email")} />
  // ... many more fields
</form>
```

### After (New Way)
```tsx
// Simple hook usage
const { openAddModal, FormModalComponent } = useFormModal({
  entityType: 'vendor',
  apiEndpoint: '/vendors',
  onSuccess: () => refreshData()
});

// Just render the component
<FormModalComponent />
```

## API Integration

The hook automatically handles:
- POST requests for add operations
- PUT requests for edit operations
- Error handling (timeout, network, auth errors)
- Success notifications
- Loading states

## Customization

### Adding New Entity Types

1. Add the entity type to the `FormModalProps` interface
2. Add default form data in `defaultFormData`
3. Update field sections in `fieldSections` if needed
4. Add any special enum options in `enumOptions`

### Custom Field Rendering

The system supports custom field rendering through the existing `EditModal` configuration system. Fields are automatically detected and rendered based on:
- Field name patterns
- Data types
- Entity type context

## Error Handling

The system provides comprehensive error handling:
- Network errors
- Server timeouts
- Authentication errors
- Validation errors
- Generic fallback errors

All errors are displayed as toast notifications to the user.

## Performance

- Form fields are dynamically rendered based on entity type
- Unnecessary fields are excluded automatically
- Modal only renders when open
- Efficient state management with React hooks

## Testing

To test the integration:

1. Navigate to any page (leads, vendors, candidates, etc.)
2. Click "Add New [Entity]" button
3. Verify form fields are appropriate for the entity type
4. Fill out and submit the form
5. Verify data is saved correctly
6. Test edit functionality by clicking on existing records

## Troubleshooting

### Common Issues

1. **Form not opening**: Check that `openAddModal` is called correctly
2. **Wrong fields showing**: Verify `entityType` is set correctly
3. **API errors**: Check `apiEndpoint` path and server connectivity
4. **Styling issues**: Ensure Tailwind CSS classes are available

### Debug Mode

Add console logs to see what's happening:

```tsx
const { openAddModal } = useFormModal({
  entityType: 'vendor',
  apiEndpoint: '/vendors',
  onSuccess: () => {
    console.log('Success callback triggered');
  }
});
```

## Future Enhancements

- [ ] Add form validation rules per entity type
- [ ] Support for file uploads
- [ ] Custom field components
- [ ] Form templates
- [ ] Bulk operations
- [ ] Form analytics

---

This modular form system eliminates code duplication and provides a consistent, maintainable solution for all form operations across the application.
