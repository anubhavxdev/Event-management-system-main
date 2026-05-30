import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Upload,
    Calendar,
    MapPin,
    Type,
    IndianRupee,
    Users,
    Tag,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { API_BASE_URL } from '../../config';
import toast from "react-hot-toast";

export default function CreateEvent() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: 'General',
        price: '',
        capacity: '',
        poster: null,
        tags: [],
    });

    const [tagInput, setTagInput] = useState('');
    const [existingPoster, setExistingPoster] = useState('');
    const [galleryItems, setGalleryItems] = useState([]); // Array of { id, type: 'existing'|'new', url, file }

    useEffect(() => {
        if (isEditMode) {
            const fetchEventDetails = async () => {
                try {
                    setFetching(true);
                    const res = await fetch(`${API_BASE_URL}/api/events/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        const event = data.event;

                        // Parse date & time
                        const eventDate = new Date(event.date);
                        const dateStr = eventDate.toISOString().split('T')[0];
                        const timeStr = eventDate.toTimeString().split(' ')[0].substring(0, 5);

                        setFormData({
                            title: event.title || '',
                            description: event.description || '',
                            date: dateStr || '',
                            time: timeStr || '',
                            location: event.location || '',
                            category: event.category || 'General',
                            price: event.price || '',
                            capacity: event.capacity || '',
                            poster: null,
                            tags: event.tags || [],
                        });

                        setExistingPoster(event.posterUrl || '');
                        if (event.gallery && Array.isArray(event.gallery)) {
                            setGalleryItems(
                                event.gallery.map((url, idx) => ({
                                    id: `existing-${idx}-${Math.random()}`,
                                    type: 'existing',
                                    url
                                }))
                            );
                        }
                    } else {
                        toast.error("Failed to load event details");
                    }
                } catch (error) {
                    console.error("Failed to fetch event:", error);
                    toast.error("Something went wrong while loading event details");
                } finally {
                    setFetching(false);
                }
            };
            fetchEventDetails();
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'poster') {
            const file = files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    toast.error("Poster image must be less than 5MB");
                    e.target.value = '';
                    return;
                }
                if (!file.type.startsWith('image/')) {
                    toast.error("Poster must be an image file");
                    e.target.value = '';
                    return;
                }
                setFormData({
                    ...formData,
                    poster: file,
                });
            }
            e.target.value = '';
        } else if (name === 'gallery') {
            const maxNew = 6 - galleryItems.length;
            if (maxNew <= 0) {
                e.target.value = '';
                toast.error("Maximum 6 gallery images allowed");
                return;
            }
            const selectedFiles = Array.from(files);
            const validFiles = [];
            for (const file of selectedFiles) {
                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`${file.name} is larger than 5MB`);
                    continue;
                }
                if (!file.type.startsWith('image/')) {
                    toast.error(`${file.name} is not an image`);
                    continue;
                }
                validFiles.push(file);
            }

            if (validFiles.length === 0) {
                e.target.value = '';
                return;
            }

            const filesToAdd = validFiles.slice(0, maxNew);
            if (validFiles.length > maxNew) {
                toast.error(`Only added first ${maxNew} images to respect the 6-image limit`);
            }

            const newItems = filesToAdd.map(file => ({
                id: `new-${file.name}-${Math.random()}`,
                type: 'new',
                file,
                url: URL.createObjectURL(file)
            }));
            setGalleryItems([...galleryItems, ...newItems]);
            e.target.value = '';
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const removeGalleryItem = async (index) => {
        const item = galleryItems[index];

        // If this is an existing image and we're editing, attempt to delete immediately on the server
        if (item && item.type === 'existing' && isEditMode) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/api/events/${id}/gallery/${index}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.message || 'Failed to delete image');
                    return;
                }

                const data = await res.json();
                // Update local galleryItems to reflect server response
                setGalleryItems(data.event.gallery.map((url, idx) => ({ id: `existing-${idx}-${Math.random()}`, type: 'existing', url })));
                return;
            } catch (error) {
                console.error('Failed to delete gallery image:', error);
                toast.error('Failed to delete image');
                return;
            }
        }

        // Otherwise simply remove locally (newly added images)
        setGalleryItems(galleryItems.filter((_, i) => i !== index));
    };

    const moveGalleryItem = (index, direction) => {
        const updated = [...galleryItems];
        const target = index + direction;
        if (target < 0 || target >= updated.length) return;
        const temp = updated[index];
        updated[index] = updated[target];
        updated[target] = temp;
        setGalleryItems(updated);
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();

            const newTag = tagInput.trim().toLowerCase();

            if (
                newTag &&
                !formData.tags.includes(newTag) &&
                formData.tags.length < 10
            ) {
                setFormData({
                    ...formData,
                    tags: [...formData.tags, newTag],
                });
            }

            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(
                (tag) => tag !== tagToRemove
            ),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const loadingToast = toast.loading(isEditMode ? "Saving changes..." : "Creating event...");

        try {
            const token = localStorage.getItem('token');
            let currentGalleryItems = [...galleryItems];

            // 1. In Edit mode, if there are newly selected files, upload them to the gallery first
            if (isEditMode) {
                const newFiles = currentGalleryItems.filter(item => item.type === 'new');
                if (newFiles.length > 0) {
                    const galleryData = new FormData();
                    newFiles.forEach(item => {
                        galleryData.append('gallery', item.file);
                    });

                    const uploadRes = await fetch(`${API_BASE_URL}/api/events/${id}/gallery`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: galleryData
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        const returnedGallery = uploadData.event.gallery; // This has all existing + new URLs
                        const newUrls = returnedGallery.slice(returnedGallery.length - newFiles.length);

                        let newUrlIndex = 0;
                        currentGalleryItems = currentGalleryItems.map(item => {
                            if (item.type === 'new') {
                                return {
                                    ...item,
                                    type: 'existing',
                                    url: newUrls[newUrlIndex++]
                                };
                            }
                            return item;
                        });
                    } else {
                        const errData = await uploadRes.json();
                        throw new Error(errData.message || "Failed to upload new gallery images");
                    }
                }
            }

            // 2. Prepare basic event update / create body
            const data = new FormData();
            const fullDate = new Date(`${formData.date}T${formData.time}`);

            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('date', fullDate.toISOString());
            data.append('location', formData.location);
            data.append('category', formData.category);
            data.append('price', formData.price);
            data.append('capacity', formData.capacity);
            data.append('tags', JSON.stringify(formData.tags));

            if (formData.poster) {
                data.append('poster', formData.poster);
            }

            if (isEditMode) {
                // For editing, send the final exact ordered list of gallery URLs
                const finalGalleryUrls = currentGalleryItems.map(item => item.url);
                data.append('gallery', JSON.stringify(finalGalleryUrls));

                const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: data
                });

                if (res.ok) {
                    toast.success("Event updated successfully!", { id: loadingToast });
                    navigate('/organizer/dashboard');
                } else {
                    const err = await res.json();
                    toast.error(err.message || "Failed to update event", { id: loadingToast });
                }
            } else {
                // Create mode
                const res = await fetch(`${API_BASE_URL}/api/events`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: data
                });

                if (res.ok) {
                    const eventData = await res.json();
                    const eventId = eventData.event._id;

                    // If there are new gallery images, upload them
                    const newFiles = currentGalleryItems.filter(item => item.type === 'new');
                    if (newFiles.length > 0) {
                        const galleryData = new FormData();
                        newFiles.forEach(item => {
                            galleryData.append('gallery', item.file);
                        });

                        await fetch(`${API_BASE_URL}/api/events/${eventId}/gallery`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            body: galleryData
                        });
                    }

                    toast.success("Event created successfully!", { id: loadingToast });
                    navigate('/organizer/dashboard');
                } else {
                    const err = await res.json();
                    toast.error(err.message || "Failed to create event", { id: loadingToast });
                }
            }
        } catch (error) {
            console.error("Failed to submit event form:", error);
            toast.error(error.message || "Something went wrong", { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pt-24 px-4 pb-12">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">
                        {isEditMode ? "Edit Event" : "Create New Event"}
                    </h1>

                    <p className="text-muted-foreground mt-2">
                        {isEditMode ? "Modify details of your existing event" : "Fill in the details to publish your event"}
                    </p>
                </div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 bg-card border border-border p-8 rounded-2xl shadow-xl"
                    onSubmit={handleSubmit}
                >
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">
                                Event Title
                            </Label>

                            <div className="relative mt-2">
                                <Type className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                                <Input
                                    id="title"
                                    name="title"
                                    className="pl-9"
                                    placeholder="e.g. Annual Tech Conference"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">
                                Description
                            </Label>

                            <Textarea
                                id="description"
                                name="description"
                                className="mt-2"
                                placeholder="Tell people what your event is about..."
                                rows={5}
                                required
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="date">
                                    Date
                                </Label>

                                <div className="relative mt-2">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                                    <Input
                                        type="date"
                                        id="date"
                                        name="date"
                                        className="pl-9"
                                        required
                                        value={formData.date}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="time">
                                    Time
                                </Label>

                                <Input
                                    type="time"
                                    id="time"
                                    name="time"
                                    className="mt-2"
                                    required
                                    value={formData.time}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="location">
                                Location
                            </Label>

                            <div className="relative mt-2">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                                <Input
                                    id="location"
                                    name="location"
                                    className="pl-9"
                                    placeholder="e.g. Grand Hall, New York"
                                    required
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="category">
                                    Category
                                </Label>

                                <div className="relative mt-2">
                                    <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                                    <select
                                        id="category"
                                        name="category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-9"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        <option value="General">General</option>
                                        <option value="Music">Music</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Arts">Arts</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="price">
                                    Price (₹)
                                </Label>

                                <div className="relative mt-2">
                                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                                    <Input
                                        type="number"
                                        id="price"
                                        name="price"
                                        className="pl-9"
                                        placeholder="0"
                                        required
                                        value={formData.price}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="capacity">
                                    Capacity
                                </Label>

                                <div className="relative mt-2">
                                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                                    <Input
                                        type="number"
                                        id="capacity"
                                        name="capacity"
                                        className="pl-9"
                                        placeholder="100"
                                        required
                                        value={formData.capacity}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="tags">
                                Tags
                            </Label>

                            <Input
                                id="tags"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="Type tag and press Enter"
                                className="mt-2"
                            />

                            <div className="flex flex-wrap gap-2 mt-3">
                                {formData.tags.map((tag) => (
                                    <div
                                        key={tag}
                                        className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                    >
                                        #{tag}

                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="text-xs hover:text-red-500"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="poster">
                                Event Poster
                            </Label>

                            <label
                                htmlFor="poster"
                                className="block mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                            >
                                <input
                                    type="file"
                                    id="poster"
                                    name="poster"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleChange}
                                />

                                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />

                                {formData.poster ? (
                                    <p className="text-sm font-medium text-rose-500">
                                        {formData.poster.name}
                                    </p>
                                ) : existingPoster ? (
                                    <div className="flex flex-col items-center">
                                        <img src={existingPoster} alt="Current poster" className="max-h-24 object-cover rounded mb-2 border border-border" />
                                        <p className="text-xs text-muted-foreground">Click or drag file to replace current poster</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium">
                                            Click to upload image
                                        </p>

                                        <p className="text-xs text-muted-foreground mt-1">
                                            SVG, PNG, JPG or GIF
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>

                        <div>
                            <Label htmlFor="gallery">
                                Gallery Images
                            </Label>

                            <p className="text-xs text-muted-foreground mt-1 mb-3">
                                Up to 6 photos
                            </p>

                            <label
                                htmlFor="gallery"
                                className="block mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                            >
                                <input
                                    type="file"
                                    id="gallery"
                                    name="gallery"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleChange}
                                    disabled={galleryItems.length >= 6}
                                />

                                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />

                                <div>
                                    <p className="text-sm font-medium">
                                        Click to upload images
                                    </p>

                                    <p className="text-xs text-muted-foreground mt-1">
                                        SVG, PNG, JPG or GIF ({galleryItems.length}/6)
                                    </p>
                                </div>
                            </label>

                            {galleryItems.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                    {galleryItems.map((item, index) => (
                                        <div key={item.id} className="relative group bg-card border border-border p-2 rounded-xl flex flex-col justify-between">
                                            <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                                                <img
                                                    src={item.url}
                                                    alt={`Gallery ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between mt-2 bg-black/40 rounded px-2 py-1">
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveGalleryItem(index, -1)}
                                                        disabled={index === 0}
                                                        className="text-white/75 hover:text-white disabled:opacity-30 p-1 rounded hover:bg-white/15 transition-colors"
                                                        title="Move Left"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveGalleryItem(index, 1)}
                                                        disabled={index === galleryItems.length - 1}
                                                        className="text-white/75 hover:text-white disabled:opacity-30 p-1 rounded hover:bg-white/15 transition-colors"
                                                        title="Move Right"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeGalleryItem(index)}
                                                    className="text-rose-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors"
                                                    title="Remove Image"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/organizer/dashboard')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-rose-500 hover:bg-rose-600 text-white min-w-[150px]"
                            disabled={loading}
                        >
                            {loading
                                ? (isEditMode ? 'Saving...' : 'Creating...')
                                : (isEditMode ? 'Save Changes' : 'Create Event')}
                        </Button>
                    </div>
                </motion.form>
            </div>
        </div>
    );
}