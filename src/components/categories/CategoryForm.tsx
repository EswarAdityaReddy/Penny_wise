
"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData } from '@/contexts/DataContext';
import type { Category } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import * as LucideIcons from 'lucide-react'; // Import all icons

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1, 'Icon is required'), 
  color: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  onSubmitSuccess?: (category: Category) => void;
  initialData?: Category | null;
  onCancel?: () => void;
}

// Curated list of common and useful Lucide icons
const curatedIconNames: (keyof typeof LucideIcons.icons)[] = [
  'Activity', 'Airplay', 'AlarmClock', 'AlertCircle', 'Archive', 'Award', 'Baby', 
  'BadgeCheck', 'BaggageClaim', 'Banknote', 'BarChart', 'Bell', 'Bike', 'Bitcoin', 
  'Book', 'BookOpen', 'Bookmark', 'Briefcase', 'Brush', 'Building', 'Bus', 'Cake', 
  'Calculator', 'Calendar', 'Camera', 'Car', 'Carrot', 'Cat', 'CheckCircle', 'ChefHat', 
  'Cherry', 'Church', 'CircleDollarSign', 'Clipboard', 'Clock', 'Cloud', 'Coffee', 
  'Coins', 'Compass', 'Computer', 'Construction', 'Contact', 'CreditCard', 'Crop', 
  'Crown', 'CupSoda', 'Currency', 'Database', 'Diamond', 'Dog', 'DollarSign', 
  'Download', 'Drama', 'Dumbbell', 'Edit', 'Egg', 'Eraser', 'Euro', 'Eye', 
  'Factory', 'FerrisWheel', 'File', 'Film', 'Filter', 'Fish', 'Flag', 'Flame', 
  'FlaskConical', 'Flower', 'Folder', 'Footprints', 'Forklift', 'Fuel', 'Gamepad2', 
  'Gem', 'Gift', 'GraduationCap', 'Grape', 'Grid', 'Hammer', 'HandCoins', 'HandHeart', 
  'Handshake', 'HardDrive', 'HardHat', 'Headphones', 'Heart', 'HeartPulse', 'HelpCircle', 
  'HelpingHand', 'Home', 'Hotel', 'Hourglass', 'IceCream', 'Image', 'Inbox', 'IndianRupee', 
  'Key', 'Keyboard', 'Landmark', 'Laptop', 'Laugh', 'Layers', 'LayoutGrid', 'Library', 
  'LifeBuoy', 'Lightbulb', 'LineChart', 'Link', 'List', 'Loader', 'Lock', 'LogIn', 'LogOut', 
  'Luggage', 'Mail', 'Map', 'MapPin', 'Martini', 'Medal', 'Megaphone', 'Menu', 'MessageCircle', 
  'Mic', 'Milk', 'MinusCircle', 'Monitor', 'Moon', 'MoreHorizontal', 'Mountain', 'Mouse', 
  'Music', 'Navigation', 'Newspaper', 'Nut', 'Package', 'Palette', 'Paperclip', 'ParkingCircle', 
  'PartyPopper', 'PauseCircle', 'Pen', 'Percent', 'PersonStanding', 'Phone', 'PictureInPicture', 
  'PieChart', 'PiggyBank', 'Pin', 'Pizza', 'Plane', 'PlayCircle', 'Plug', 'PlusCircle', 'Pocket', 
  'Podcast', 'PoundSterling', 'Power', 'Printer', 'Puzzle', 'QrCode', 'Quote', 'Receipt', 
  'Recycle', 'Redo', 'RefreshCcw', 'Refrigerator', 'Repeat', 'Reply', 'Rocket', 'Rss', 
  'Ruler', 'Save', 'Scale', 'School', 'Scissors', 'ScreenShare', 'Search', 'Send', 'Server', 
  'Settings', 'Share2', 'Sheet', 'Shield', 'ShieldCheck', 'Ship', 'ShoppingBag', 'ShoppingCart', 
  'Shovel', 'ShowerHead', 'Smartphone', 'Smile', 'Snowflake', 'Sparkles', 'Speaker', 'Sprout', 
  'Star', 'Store', 'Sun', 'Sunrise', 'Sunset', 'SwissFranc', 'Table', 'Tablet', 'Tag', 'Target', 
  'Tent', 'Terminal', 'Ticket', 'Timer', 'ToggleLeft', 'ToyBrick', 'Train', 'Trash2', 'TreePine', 
  'TrendingDown', 'TrendingUp', 'Trophy', 'Truck', 'Tv', 'Umbrella', 'Undo', 'Unlink', 'Upload', 
  'User', 'Users', 'Utensils', 'UtensilsCrossed', 'Vegan', 'Video', 'Volume2', 'Wallet', 'Watch', 
  'Webhook', 'Wifi', 'Wind', 'Wine', 'Wrench', 'Yen', 'Zap', 'ZoomIn', 'ZoomOut'
].sort();


export function CategoryForm({ onSubmitSuccess, initialData, onCancel }: CategoryFormProps) {
  const { addCategory, updateCategory } = useData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formDefaultValues = initialData || { name: '', icon: 'Tag', color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)` };

  const { control, handleSubmit, register, formState: { errors }, reset } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: formDefaultValues,
  });

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    let newOrUpdatedCategory: Category | undefined = undefined;
    try {
      if (initialData) {
        const categoryToUpdate = { ...initialData, ...data };
        await updateCategory(categoryToUpdate);
        newOrUpdatedCategory = categoryToUpdate;
        toast({ title: "Category Updated", description: `Category "${data.name}" has been updated.` });
      } else {
        const addedCategory = await addCategory(data);
        if (addedCategory) {
          newOrUpdatedCategory = addedCategory;
          toast({ title: "Category Added", description: `Category "${data.name}" has been added.` });
        }
      }
      
      reset(formDefaultValues); 
      
      if (onSubmitSuccess && newOrUpdatedCategory) {
        onSubmitSuccess(newOrUpdatedCategory);
      }

    } catch (error) {
      toast({ title: "Error", description: "Could not save category. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="font-body">Category Name</Label>
        <Input id="name" {...register('name')} aria-invalid={errors.name ? "true" : "false"} className="font-body"/>
        {errors.name && <p className="text-sm text-destructive font-body">{errors.name.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="icon" className="font-body">Icon</Label>
        <Controller
          name="icon"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="icon" className="font-body">
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {(curatedIconNames || []).map(iconName => {
                  const IconComponent = LucideIcons.icons[iconName] as React.ElementType;
                  if (!IconComponent || typeof IconComponent !== 'function') return null;
                  return (
                    <SelectItem key={iconName} value={iconName} className="font-body">
                      <div className="flex items-center">
                        <IconComponent className="mr-2 h-4 w-4" />
                        {iconName}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        />
        {errors.icon && <p className="text-sm text-destructive font-body">{errors.icon.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="color" className="font-body">Color</Label>
        <Controller
            name="color"
            control={control}
            defaultValue={formDefaultValues.color}
            render={({ field }) => (
                <Input 
                    id="color" 
                    type="color" 
                    value={field.value || ''} 
                    onChange={field.onChange} 
                    className="font-body w-full h-10 p-1"
                />
            )}
        />
        {errors.color && <p className="text-sm text-destructive font-body">{errors.color.message}</p>}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={() => { reset(formDefaultValues); onCancel();}} disabled={isSubmitting} className="font-body">Cancel</Button>}
        <Button type="submit" disabled={isSubmitting} className="font-body">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Update Category' : 'Add Category'}
        </Button>
      </div>
    </form>
  );
}

