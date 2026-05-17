import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Calendar, MapPin, Type, IndianRupee, Users, Tag } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { API_BASE_URL } from '../../config';

export default function CreateEvent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        category: 'General',
        price: '',
        capacity: '',
        poster: null
    });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'poster') {
            setFormData({ ...formData, poster: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            // Combine date and time
            const fullDate = new Date(`${formData.date}T${formData.time}`);

            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('date', fullDate.toISOString());
            data.append('location', formData.location);
            data.append('category', formData.category);
            data.append('price', formData.price);
            data.append('capacity', formData.capacity);
            if (formData.poster) {
                data.append('poster', formData.poster);
            }

            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            if (res.ok) {
                navigate('/organizer/dashboard');
            } else {
                const err = await res.json();
                alert(`Error: ${err.message}`);
            }
        } catch (error) {
            console.error("Failed to create event", error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen pt-24 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Create New Event</h1>
                    <p className="text-muted-foreground mt-2">Fill in the details to publish your event</p>
                </div>

                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8 bg-card border border-border p-8 rounded-2xl shadow-xl"
                    onSubmit={handleSubmit}
                >
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">Event Title</Label>
                            <div className="relative mt-2">
                                <Type className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="title"
                                    name="title"
                                    className="pl-9"
                                    placeholder="e.g. Annual Tech Conference"
                                    required
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
    <Label htmlFor="description">Description</Label>
    <Textarea
        id="description"
        name="description"
        className="mt-2"
        placeholder="Tell people what your event is about..."
        rows={5}
        required
        maxLength={500}
        onChange={handleChange}
    />
    <div className="flex justify-end mt-1">
        <span className={`text-xs font-medium ${
            formData.description.length > 450
                ? 'text-red-500'
                : 'text-muted-foreground'
        }`}>
            {formData.description.length} / 500
            {formData.description.length > 450 ? ' ❌' : ' ✅'}
        </span>
    </div>
</div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <div className="relative mt-2">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input type="date" id="date" name="date" className="pl-9" required onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="time">Time</Label>
                                <Input type="time" id="time" name="time" className="mt-2" required onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="location">Location</Label>
                            <div className="relative mt-2">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input id="location" name="location" className="pl-9" placeholder="e.g. Grand Hall, New York" required onChange={handleChange} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="category">Category</Label>
                                <div className="relative mt-2">
                                    <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <select
                                        id="category"
                                        name="category"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
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
                                <Label htmlFor="price">Price (₹)</Label>
                                <div className="relative mt-2">
                                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input type="number" id="price" name="price" className="pl-9" placeholder="0" required onChange={handleChange} />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="capacity">Capacity</Label>
                                <div className="relative mt-2">
                                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input type="number" id="capacity" name="capacity" className="pl-9" placeholder="100" required onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="poster">Event Poster</Label>
                            <div className="mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                                <Input
                                    type="file"
                                    id="poster"
                                    name="poster"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleChange}
                                />
                                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                                {formData.poster ? (
                                    <p className="text-sm font-medium text-rose-500">{formData.poster.name}</p>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium">Click to upload image</p>
                                        <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button 
    type="submit" 
    className="bg-rose-500 hover:bg-rose-600 text-white min-w-[150px]" 
    disabled={loading || formData.description.length > 500}
>
    {loading ? 'Creating...' : 'Create Event'}
</Button>
                    </div>
                </motion.form>
            </div>
        </div>
    );
}
