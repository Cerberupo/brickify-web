import React from 'react';
import {Avatar, AvatarImage} from '@/components/ui';
const faviconUrl: string = '/favicon.png';

interface ReferencePeopleAvatarsProps {
    /** Top-level referencePeople array: person | group */
    entries: any[];
    /** Avatar size in pixels (width/height). Default 28 (roughly h-7 w-7). */
    size?: number;
    /** Whether to display overlapping layout (like -space-x-2). Default true. */
    overlap?: boolean;
    /** Max number of avatars to render. Omit to show all. */
    max?: number;
    /** Additional className for the container */
    className?: string;
}

/**
 * Renders avatars for reference people, flattening subgroup members, ordering by presence of image.
 * Provides consistent styling (object-cover, subtle ring/border) and favicon fallback.
 */
export default function ReferencePeopleAvatars({
                                                   entries,
                                                   size = 28,
                                                   overlap = true,
                                                   max,
                                                   className,
                                               }: ReferencePeopleAvatarsProps) {
    const flatten = React.useCallback((items: any[]): any[] => {
        const out: any[] = [];
        for (const e of items || []) {
            if (!e) continue;
            if (e.type === 'group' && Array.isArray(e.people)) out.push(...flatten(e.people));
            else out.push(e);
        }
        return out;
    }, []);

    const flatMembers = React.useMemo(() => {
        const flat = flatten(entries || []);
        // Order: first those who have an image, then those who don't
        flat.sort((a: any, b: any) => {
            const aHas = Boolean(a?.imageSignedUrl || a?.imagePath || a?.avatar);
            const bHas = Boolean(b?.imageSignedUrl || b?.imagePath || b?.avatar);
            if (aHas === bHas) return 0;
            return aHas ? -1 : 1;
        });
        return typeof max === 'number' ? flat.slice(0, Math.max(0, max)) : flat;
    }, [entries, flatten, max]);

    const containerClass = `flex ${overlap ? '-space-x-2' : 'gap-2'} overflow-hidden ${className || ''}`.trim();

    // Style size inline to avoid needing dynamic Tailwind classes
    const avatarStyle: React.CSSProperties = {width: size, height: size};

    if (!flatMembers || flatMembers.length === 0) {
        return null;
    }

    return (
        <div className={containerClass}>
            {flatMembers.map((user: any) => {
                const src = user?.imageSignedUrl || user?.imagePath || user?.avatar || faviconUrl;
                return (
                    <Avatar key={user.id} className="border-2 border-background" style={avatarStyle}>
                        <AvatarImage className="object-cover" src={src} alt={user?.name || ''}/>
                    </Avatar>
                );
            })}
        </div>
    );
}
