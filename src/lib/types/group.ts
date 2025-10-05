import type {GroupType} from "@/constants/group.ts";

/**
 * Interface for a group
 */
export interface Group {
    id: string;
    name: string;
    description: string;
    groupType: GroupType;
    usersCompleted: number;
    totalUsers: number;
    referencePeople: {
        id: string;
        name: string;
        avatar?: string;
        imageSignedUrl?: string;
        imagePath?: string;
        description?: string;
        hasImage?: boolean;
        hairDescription?: string;
        faceDescription?: string;
    }[];
    status:
        | 'needsMoreUsers'       // Needs more users
        | 'readyForPayment'      // Ready to place order
        | 'inProcess'            // After payment, selecting Lego pieces
        | 'waitingForApproval'   // Pieces selected, waiting for user approval
        | 'orderPlaced'          // Order placed with Lego
        | 'orderIncomplete'      // Order placed with Lego but some pieces are missing or incorrect
        | 'inReview'             // Order arrived, checking pieces
        | 'inAssembly'           // Assembling Lego pieces
        | 'readyForShipment'     // Assembly complete, ready to ship
        | 'shipped'              // Order shipped to customer
    price?: number;
}
