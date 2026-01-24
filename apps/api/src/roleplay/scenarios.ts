/**
 * Roleplay scenarios for German learning
 * Each scenario has structured context, roles, and level-appropriate starters
 */

export interface Scenario {
    title: string;
    context: string;
    userRole: string;
    aiRole: string;
    level: string;
    starterDE: string;
    starterEN: string;
    suggestedResponses: string[];
}

export const SCENARIOS: Record<string, Scenario> = {
    cafe: {
        title: 'At the Café',
        context:
            'You are at a German café ordering drinks and snacks. The waiter approaches your table.',
        userRole: 'Customer',
        aiRole: 'Waiter',
        level: 'A1',
        starterDE: 'Guten Tag! Willkommen im Café. Was darf ich Ihnen bringen?',
        starterEN: 'Good day! Welcome to the café. What can I bring you?',
        suggestedResponses: [
            'Einen Kaffee, bitte.',
            'Ich möchte einen Tee.',
            'Haben Sie Kuchen?',
        ],
    },
    trainStation: {
        title: 'At the Train Station',
        context:
            'You need to buy a train ticket to Munich. You are at the ticket counter.',
        userRole: 'Traveler',
        aiRole: 'Ticket Agent',
        level: 'A1',
        starterDE:
            'Guten Tag! Wie kann ich Ihnen helfen? Wohin möchten Sie fahren?',
        starterEN: 'Good day! How can I help you? Where would you like to go?',
        suggestedResponses: [
            'Einmal nach München, bitte.',
            'Was kostet die Fahrkarte?',
            'Wann fährt der nächste Zug?',
        ],
    },
    supermarket: {
        title: 'At the Supermarket',
        context:
            'You are shopping for groceries and cannot find what you are looking for. You ask an employee for help.',
        userRole: 'Customer',
        aiRole: 'Employee',
        level: 'A2',
        starterDE: 'Hallo! Kann ich Ihnen helfen? Sie sehen etwas verloren aus.',
        starterEN: 'Hello! Can I help you? You look a bit lost.',
        suggestedResponses: [
            'Wo finde ich die Milch?',
            'Haben Sie frisches Brot?',
            'Ich suche Bio-Eier.',
        ],
    },
    doctor: {
        title: 'At the Doctor',
        context:
            'You are visiting a general practitioner for a check-up or because you feel unwell.',
        userRole: 'Patient',
        aiRole: 'Doctor',
        level: 'A2',
        starterDE:
            'Guten Tag. Bitte nehmen Sie Platz. Was führt Sie heute zu mir?',
        starterEN:
            'Good day. Please have a seat. What brings you to me today?',
        suggestedResponses: [
            'Ich habe Kopfschmerzen.',
            'Mir ist schlecht.',
            'Ich brauche ein Rezept.',
        ],
    },
    hotel: {
        title: 'Hotel Check-in',
        context:
            'You arrive at a hotel in Germany and need to check in at the front desk.',
        userRole: 'Guest',
        aiRole: 'Receptionist',
        level: 'A2',
        starterDE:
            'Herzlich willkommen in unserem Hotel! Haben Sie eine Reservierung?',
        starterEN: 'Welcome to our hotel! Do you have a reservation?',
        suggestedResponses: [
            'Ja, auf den Namen...',
            'Ich habe online gebucht.',
            'Haben Sie noch Zimmer frei?',
        ],
    },
    jobInterview: {
        title: 'Job Interview',
        context:
            'You are interviewing for a position at a German company. The interview is conducted in German.',
        userRole: 'Candidate',
        aiRole: 'Interviewer',
        level: 'B1',
        starterDE:
            'Guten Tag und willkommen. Danke, dass Sie heute gekommen sind. Erzählen Sie mir bitte etwas über sich.',
        starterEN:
            'Good day and welcome. Thank you for coming today. Please tell me something about yourself.',
        suggestedResponses: [
            'Ich habe drei Jahre Erfahrung in...',
            'Ich interessiere mich für diese Stelle, weil...',
            'Meine Stärken sind...',
        ],
    },
    apartment: {
        title: 'Apartment Viewing',
        context:
            'You are viewing an apartment for rent and speaking with the landlord about details.',
        userRole: 'Prospective Tenant',
        aiRole: 'Landlord',
        level: 'B1',
        starterDE:
            'Willkommen! Das ist die Wohnung. Sie hat zwei Zimmer und einen Balkon. Haben Sie Fragen?',
        starterEN:
            'Welcome! This is the apartment. It has two rooms and a balcony. Do you have questions?',
        suggestedResponses: [
            'Wie hoch ist die Miete?',
            'Sind die Nebenkosten inklusive?',
            'Ab wann ist die Wohnung frei?',
        ],
    },
    bankAccount: {
        title: 'Opening a Bank Account',
        context:
            'You are at a German bank to open a new account. The bank advisor is helping you.',
        userRole: 'New Customer',
        aiRole: 'Bank Advisor',
        level: 'B1',
        starterDE:
            'Guten Tag! Sie möchten ein Konto eröffnen? Ausgezeichnet. Haben Sie Ihren Ausweis dabei?',
        starterEN:
            'Good day! You would like to open an account? Excellent. Do you have your ID with you?',
        suggestedResponses: [
            'Ja, hier ist mein Reisepass.',
            'Welche Kontooptionen haben Sie?',
            'Gibt es Gebühren?',
        ],
    },
    complaint: {
        title: 'Making a Complaint',
        context:
            'You received a defective product and are speaking to customer service to resolve the issue.',
        userRole: 'Customer',
        aiRole: 'Customer Service Representative',
        level: 'B2',
        starterDE:
            'Guten Tag, Kundenservice. Wie kann ich Ihnen behilflich sein?',
        starterEN: 'Good day, customer service. How can I help you?',
        suggestedResponses: [
            'Ich möchte mich über ein Produkt beschweren.',
            'Das Gerät funktioniert nicht richtig.',
            'Ich hätte gern eine Rückerstattung.',
        ],
    },
    debate: {
        title: 'Discussion on Current Events',
        context:
            'You are having a discussion with a German acquaintance about a current topic like climate change or technology.',
        userRole: 'Discussion Partner',
        aiRole: 'Acquaintance',
        level: 'B2',
        starterDE:
            'Was denken Sie eigentlich über die aktuellen Entwicklungen beim Klimaschutz? Ich finde, es wird viel zu wenig getan.',
        starterEN:
            'What do you actually think about the current developments in climate protection? I think far too little is being done.',
        suggestedResponses: [
            'Da stimme ich Ihnen zu, aber...',
            'Ich sehe das etwas anders...',
            'Das ist ein komplexes Thema...',
        ],
    },
};

export function getScenarioById(id: string): Scenario | undefined {
    return SCENARIOS[id];
}

export function getScenariosByLevel(level: string): Scenario[] {
    return Object.values(SCENARIOS).filter(s => s.level === level);
}

export function getAllScenarios(): { id: string; scenario: Scenario }[] {
    return Object.entries(SCENARIOS).map(([id, scenario]) => ({
        id,
        scenario,
    }));
}
