/**
 * Interface for a group
 */
export interface Group {
    id: string;
    name: string;
    description: string;
    usersCompleted: number;
    totalUsers: number;
    referencePeople: {
        id: string;
        name: string;
        avatar?: string;
    }[];
    status:
        | 'needsMoreUsers'       // Needs more users to reach minimum of 25
        | 'needsCompletedUsers'  // Has 25+ users but some are incomplete
        | 'readyForPayment'      // Has 25+ completed users, waiting for payment
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
