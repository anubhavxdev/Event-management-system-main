{activeTab === 'Past Events' && (
  <div className="space-y-6">
    {pastEvents.length === 0 ? (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full h-80 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-6"
      >
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-medium text-foreground">
          No past events
        </h3>

        <p className="text-muted-foreground mt-2 max-w-sm">
          You haven't attended any past events yet.
        </p>
      </motion.div>
    ) : (
      <div className="grid grid-cols-1 gap-6">
        {pastEvents.map((reg, idx) => (
          <motion.div
            key={reg._id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative bg-card/60 border border-border rounded-2xl p-4 transition-colors shadow-sm opacity-75 hover:opacity-100"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-40 h-24 rounded-xl overflow-hidden shrink-0 bg-muted grayscale group-hover:grayscale-0 transition-all">
                {reg.event?.posterUrl ? (
                  <img
                    src={reg.event.posterUrl}
                    alt={reg.event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Calendar className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-semibold text-foreground">
                    {reg.event?.title}
                  </h3>

                  <span
                    className={`inline-flex items-center text-xs px-2 py-1 rounded-full border ${
                      reg.status === 'attended'
                        ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {reg.status === 'attended'
                      ? 'Attended'
                      : 'Completed'}
                  </span>
                </div>

                <p className="text-muted-foreground text-xs mt-1">
                  {reg.event?.date
                    ? new Date(reg.event.date).toLocaleDateString()
                    : 'TBA'}{' '}
                  • {reg.event?.location}
                </p>

                {reg.status === 'attended' && (
                  <div className="mt-4">
                    <Button
                      onClick={() =>
                        generateCertificate({
                          attendeeName:
                            user?.name || 'Participant',
                          eventTitle:
                            reg.event?.title || 'Event',
                          eventDate: reg.event?.date
                            ? new Date(
                                reg.event.date
                              ).toLocaleDateString()
                            : 'TBA',
                          organizerName: 'eventOne',
                          registrationId: reg._id,
                        })
                      }
                      className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Download Certificate
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
)}