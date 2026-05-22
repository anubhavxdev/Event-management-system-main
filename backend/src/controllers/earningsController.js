import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

export const getOrganizerEarnings = async (req, res) => {
    try {
        const organizerId = req.user.id;

        const paidEvents = await Event.find({
            organizer: organizerId,
            price: { $gt: 0 },
        }).lean();

        if (paidEvents.length === 0) {
            return res.json({
                hasPaidEvents: false,
                perEvent: [],
                summary: {
                    lifetimeEarnings: 0,
                    thisMonthEarnings: 0,
                    pendingPayout: 0,
                },
                monthlyChart: [],
            });
        }

        const paidEventIds = paidEvents.map((e) => e._id);

        const paidRegistrations = await Registration.find({
            event: { $in: paidEventIds },
            paymentStatus: 'paid',
        })
            .populate('event', 'title date price')
            .lean();

        const eventRevenueMap = {};
        for (const reg of paidRegistrations) {
            const eventId = reg.event._id.toString();
            if (!eventRevenueMap[eventId]) {
                eventRevenueMap[eventId] = {
                    eventId,
                    title: reg.event.title,
                    date: reg.event.date,
                    ticketPrice: reg.event.price,
                    ticketsSold: 0,
                    revenue: 0,
                };
            }
            eventRevenueMap[eventId].ticketsSold += 1;
            eventRevenueMap[eventId].revenue += reg.amountPaid || reg.event.price || 0;
        }

        const perEvent = Object.values(eventRevenueMap).sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

        // Summary totals
        const lifetimeEarnings = perEvent.reduce((sum, e) => sum + e.revenue, 0);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthEarnings = paidRegistrations
            .filter((r) => new Date(r.createdAt) >= startOfMonth)
            .reduce((sum, r) => sum + (r.amountPaid || r.event.price || 0), 0);

        // Pending payout: placeholder — real impl depends on payout tracking
        const pendingPayout = 0;

        // Monthly chart — last 6 months
        const monthlyChart = buildMonthlyChart(paidRegistrations, 6);

        return res.json({
            hasPaidEvents: true,
            perEvent,
            summary: {
                lifetimeEarnings,
                thisMonthEarnings,
                pendingPayout,
            },
            monthlyChart,
        });
    } catch (error) {
        console.error('getOrganizerEarnings error:', error);
        res.status(500).json({ message: 'Server error fetching earnings' });
    }
};

/**
 * Build an array of { month: 'Jan 25', earnings: N } for the last `months` months.
 */
function buildMonthlyChart(registrations, months) {
    const now = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);

        const earnings = registrations
            .filter((r) => {
                const created = new Date(r.createdAt);
                return created >= start && created < end;
            })
            .reduce((sum, r) => sum + (r.amountPaid || r.event?.price || 0), 0);

        result.push({ month: label, earnings });
    }

    return result;
}