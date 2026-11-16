import type { AppLang } from '../data/sudanGeo';

export interface TranslationSchema {
  common: {
    platformName: string;
    platformTagline: string;
    loading: string;
    initializing: string;
    close: string;
    cancel: string;
    save: string;
    saving: string;
    submit: string;
    submitting: string;
    all: string;
    newLabel: string;
    privateClinic: string;
    notSpecified: string;
    yearsSuffix: string;
    reviewsCountSuffix: string;
    starsSuffix: string;
    signIn: string;
    signInWithGoogle: string;
    signingIn: string;
    signOut: string;
    suspendedTitle: string;
    suspendedReasonPrefix: string;
    suspendedDefaultMsg: string;
    authInitError: string;
    authSignInError: string;
  };
  quota: {
    bannerText: string;
    learnMore: string;
  };
  nav: {
    directory: string;
    patient: string;
    doctor: string;
    clinic: string;
    admin: string;
    whatsappActive: string;
    linkWhatsapp: string;
    whatsappActiveLong: string;
    linkWhatsappLong: string;
    whatsappSettingsTitle: string;
    navMenuAria: string;
    signOutShort: string;
    switchLangLabel: string;
    switchLangAria: string;
    darkModeToggleTitle: string;
    darkModeOn: string;
    darkModeOff: string;
  };
  footer: {
    copyright: string;
  };
  directory: {
    heroEyebrow: string;
    heroTitle: string;
    heroDesc: string;
    heroFindDoctorBtn: string;
    heroJoinBtn: string;
    heroImgAlt: string;
    statStatesSuffix: string;
    statStatesDesc: string;
    statDoctorsSuffix: string;
    statDoctorsDesc: string;
    statClinicsSuffix: string;
    statClinicsDesc: string;
    statEhrTitle: string;
    statEhrDesc: string;
    sectionTitle: string;
    sectionDesc: string;
    tabDoctors: string;
    tabClinics: string;
    allSpecialties: string;
    liveSearchLabel: string;
    liveSearchPlaceholder: string;
    specialtyLabel: string;
    stateLabel: string;
    allStatesOption: string;
    localityLabel: string;
    allLocalitiesOption: string;
    hideAdvancedFilters: string;
    showAdvancedFilters: string;
    liveResultsPrefix: string;
    liveResultsOf: string;
    clearFilters: string;
    areaLabel: string;
    areaPlaceholder: string;
    maxFeeLabel: string;
    anyFee: string;
    upToFee: string;
    genderFilterLabel: string;
    maleDoctor: string;
    femaleDoctor: string;
    workingDayLabel: string;
    allDays: string;
    sortByLabel: string;
    sortHighestRated: string;
    sortLowestFee: string;
    sortMostExperienced: string;
    noDoctorsTitle: string;
    noDoctorsDesc: string;
    showAllStatesBtn: string;
    noClinicsTitle: string;
    noClinicsDesc: string;
    experiencePrefix: string;
    consultationFee: string;
    viewAndBookBtn: string;
    licenseLabel: string;
    servicesPrefix: string;
    centerDetailsAndDoctors: string;
    qualificationsAndLicense: string;
    workplaceAndState: string;
    daysAndHours: string;
    centralApprovalLabel: string;
    approvedVerified: string;
    providedServices: string;
    reviewsAndAvgTitle: string;
    noRecentTextReviews: string;
    overallApprovedRating: string;
    bookAppointmentTitle: string;
    signInToBookPrompt: string;
    signInNowBtn: string;
    appointmentDateLabel: string;
    timeSlotLabel: string;
    visitTypeLabel: string;
    visitReasonLabel: string;
    visitReasonPlaceholder: string;
    bookingSuccessMsg: string;
    bookingErrorMsg: string;
    viewMyBookings: string;
    confirmBookingBtn: string;
    sendingBooking: string;
    geoLocationLabel: string;
    hoursAndPhoneLabel: string;
    availableMedicalServices: string;
    clinicPatientReviews: string;
    averagePrefix: string;
    noRecentClinicReviews: string;
    linkedApprovedDoctors: string;
    noLinkedDoctors: string;
    bookAppointmentBtn: string;
    voiceSearchStartAria: string;
    voiceSearchStopAria: string;
    voiceSearchListening: string;
    voiceSearchUnsupported: string;
    voiceSearchDenied: string;
    voiceSearchNoSpeech: string;
    voiceSearchError: string;
    clearSearchAria: string;
    availableNowBtn: string;
    availableNowCountSuffix: string;
    urgentOpenSlotPrefix: string;
    bookedSlotDisabled: string;
    favoriteAdd: string;
    favoriteRemove: string;
    favoriteSignInPrompt: string;
    geoFilterTitle: string;
    regionLabel: string;
    allRegionsOption: string;
    allRegionStatesOption: string;
    doctorsShortSuffix: string;
    clinicsShortSuffix: string;
    statusAvailableBadge: string;
    statusBusyBadge: string;
  };
  map: {
    sectionTitle: string;
    sectionDesc: string;
    toggleShow: string;
    toggleHide: string;
    resetView: string;
    approvedCentersCount: string;
    allSudanStates: string;
    stateFilterActive: string;
    regionFilterActive: string;
    centerListTitle: string;
    noClinicsOnMap: string;
    doctorsCountSuffix: string;
    clickPinHint: string;
    viewCenterDetails: string;
    getDirections: string;
    missingKeyTitle: string;
    missingKeyDesc: string;
    loadErrorTitle: string;
    loadErrorDesc: string;
    approxLocationNote: string;
    verifiedPlaceNote: string;
  };
  patient: {
    portalLabel: string;
    gateTitle: string;
    gateDesc: string;
    tabAppointments: string;
    tabReminders: string;
    tabFavorites: string;
    tabEhr: string;
    tabMessages: string;
    tabConsent: string;
    tabComplaints: string;
    remindersTitle: string;
    remindersDesc: string;
    toastOnBtn: string;
    toastOffBtn: string;
    waCardTitle: string;
    waCardDesc: string;
    waLinkedBadge: string;
    waNotLinkedBadge: string;
    waPhoneLabel: string;
    waPhoneValidPrefix: string;
    waPhoneInvalid: string;
    waCheckboxTitle: string;
    waCheckboxDesc: string;
    toastCheckboxTitle: string;
    toastCheckboxDesc: string;
    savePhoneAndPrefs: string;
    upcoming24hHeader: string;
    noUpcoming24h: string;
    previewNearestToast: string;
    sendViaWhatsapp: string;
    showAppToast: string;
    copyReminderText: string;
    copied: string;
    appointmentsTitle: string;
    appointmentsDesc: string;
    bookNewAppointment: string;
    upcoming24hAlertTitle: string;
    nearestAppointmentLabel: string;
    showVisualAlert: string;
    loyaltyHeader: string;
    loyaltyUnit: string;
    progressTowards: string;
    maxTierReached: string;
    visitsPointsSummary: string;
    reviewsPointsSummary: string;
    pointsRemainingPrefix: string;
    pointsRemainingSuffix: string;
    annualActivityTitle: string;
    annualActivityDesc: string;
    yearLabel: string;
    totalYearVisits: string;
    completedVisits: string;
    scheduledVisits: string;
    peakMonth: string;
    chartCompleted: string;
    chartScheduled: string;
    noYearVisits: string;
    pendingReviewsTitle: string;
    rateDoctorAndClinic: string;
    noAppointmentsTitle: string;
    noAppointmentsDesc: string;
    browseDirectory: string;
    colDoctorSpecialty: string;
    colCenterState: string;
    colDateTime: string;
    colTypeFee: string;
    colStatus: string;
    colActions: string;
    messageDoctorBtn: string;
    reviewedLabel: string;
    myReviewsTitle: string;
    clinicRatingLabel: string;
    ehrTitle: string;
    ehrDesc: string;
    exportPdfBtn: string;
    exportJsonBtn: string;
    downloadAppointmentsPdfBtn: string;
    downloadAppointmentsJsonBtn: string;
    jsonExportSuccess: string;
    printEhrBtn: string;
    printReportHeader: string;
    printGeneratedLabel: string;
    ehrFilterAll: string;
    ehrFilterVisits: string;
    ehrFilterReports: string;
    ehrFilterMedications: string;
    ehrFilterVitals: string;
    ehrFilterProfile: string;
    pastVisitsTitle: string;
    pastVisitsDesc: string;
    visitsUnit: string;
    noPastVisits: string;
    colVisitDate: string;
    colClinicLocation: string;
    colTypeReason: string;
    colReport: string;
    viewReportBtn: string;
    completedWord: string;
    diagnosticReportsTitle: string;
    diagnosticReportsDesc: string;
    noDiagnosticReports: string;
    chiefComplaintLabel: string;
    diagnosisLabel: string;
    medicationsLabel: string;
    vitalsTitle: string;
    vitalsDesc: string;
    readingsCountSuffix: string;
    noVitalsYet: string;
    addFirstVitalsBtn: string;
    bpChartTitle: string;
    weightChartTitle: string;
    bpSystolic: string;
    bpDiastolic: string;
    weightLabel: string;
    colDate: string;
    colSourceDesc: string;
    colBp: string;
    colBpStatus: string;
    colWeight: string;
    colDelta: string;
    colGlucose: string;
    colHeartRate: string;
    baselineTitle: string;
    bmiLabel: string;
    fullNameLabel: string;
    dobLabel: string;
    bloodTypeLabel: string;
    genderLabel: string;
    male: string;
    female: string;
    heightLabel: string;
    weightInputLabel: string;
    allergiesLabel: string;
    chronicLabel: string;
    emergencyLabel: string;
    saveBaselineBtn: string;
    selfMeasTitle: string;
    measDescLabel: string;
    measSystolicLabel: string;
    measDiastolicLabel: string;
    measGlucoseLabel: string;
    measHrLabel: string;
    measWeightLabel: string;
    addMeasBtn: string;
    consentTitle: string;
    consentDesc: string;
    noConsentDoctors: string;
    consentAuthorized: string;
    consentGrant: string;
    complaintsTitle: string;
    complaintsDesc: string;
    complaintTargetLabel: string;
    complaintTargetDoctor: string;
    complaintTargetClinic: string;
    complaintTargetPlatform: string;
    complaintTargetNameLabel: string;
    complaintSubjectLabel: string;
    complaintDetailsLabel: string;
    submitComplaintBtn: string;
    adminReplyLabel: string;
    reviewModalTitle: string;
    reviewModalDatePrefix: string;
    rateDoctorTitle: string;
    doctorCommentLabel: string;
    doctorCommentPlaceholder: string;
    rateClinicTitle: string;
    clinicCommentLabel: string;
    clinicCommentPlaceholder: string;
    publishReviewBtn: string;
    publishingReview: string;
    tiers: string[];
    months: string[];
    ratingLabels: Record<number, string>;
    bpNormal: string;
    bpHigh: string;
    bpElevated: string;
    bpLow: string;
    medicationsSectionTitle: string;
    medicationsSectionDesc: string;
    medicationsAddToggleBtn: string;
    medicationsEmpty: string;
    medicationsNameLabel: string;
    medicationsNamePlaceholder: string;
    medicationsDosageLabel: string;
    medicationsDosagePlaceholder: string;
    medicationsFrequencyLabel: string;
    medicationsFrequencyPlaceholder: string;
    medicationsTimesLabel: string;
    medicationsTimesHint: string;
    medicationsStatusLabel: string;
    medicationsNotesLabel: string;
    medicationsNotesPlaceholder: string;
    medicationsReminderCheck: string;
    medicationsSaveBtn: string;
    medicationsStatusActive: string;
    medicationsStatusPaused: string;
    medicationsStatusStopped: string;
    medicationsPrescribedByLabel: string;
    medicationsDueNowBadge: string;
    medicationsTakenTodayBadge: string;
    medicationsNoSchedule: string;
    medicationsNextDosePrefix: string;
    medicationsMarkTakenBtn: string;
    medicationsPreviewAlertBtn: string;
    medicationsReminderOn: string;
    medicationsReminderOff: string;
    medicationsDeleteBtn: string;
    medicationsFromReportsTitle: string;
    medicationsFromReportsDesc: string;
    medicationsImportBtn: string;
    medicationsImportedMsg: string;
    medicationsActiveAlertBanner: string;
    checkInBtn: string;
    checkingInBtn: string;
    checkedInBadge: string;
    checkedInAtPrefix: string;
    checkInSuccessMsg: string;
    todayCheckInCardTitle: string;
    todayCheckInCardDesc: string;
    waitingDoctorNotice: string;
    favoritesTitle: string;
    favoritesDesc: string;
    favoriteDoctorsTitle: string;
    favoriteClinicsTitle: string;
    noFavoritesTitle: string;
    noFavoritesDesc: string;
    removeFavoriteBtn: string;
    nextDoseCardTitle: string;
    nextDosePre15Badge: string;
    nextDoseNone: string;
    nextDoseTakenTodayCount: string;
    darkModeSectionTitle: string;
    darkModeSectionDesc: string;
    darkModeOnLabel: string;
    darkModeOffLabel: string;
    push30MinTitle: string;
    push30MinDesc: string;
    pushEnableBtn: string;
    pushEnabledBadge: string;
    pushBlockedBadge: string;
    pushUnsupportedBadge: string;
    pushTestBtn: string;
    pushTestSentMsg: string;
    pushToggleLabel: string;
    appointmentQrBtn: string;
    ehrQrBtn: string;
    qrAppointmentTitle: string;
    qrAppointmentBadge: string;
    qrEhrTitle: string;
    qrEhrBadge: string;
    qrScanHint: string;
    qrDownloadPngBtn: string;
    qrCopyPayloadBtn: string;
  };
  doctor: {
    portalLabel: string;
    gateTitle: string;
    gateDesc: string;
    signInBtn: string;
    tabProfile: string;
    tabTodayTasks: string;
    tabBookings: string;
    tabEhrAuthor: string;
    tabMessages: string;
    approvalStatusPrefix: string;
    approvedNotice: string;
    pendingNotice: string;
    rejectedPrefix: string;
    editProfileTitle: string;
    newProfileTitle: string;
    profileDesc: string;
    fullNameLabel: string;
    genderLabel: string;
    male: string;
    female: string;
    specialtyLabel: string;
    licenseLabel: string;
    expYearsLabel: string;
    feeSdgLabel: string;
    qualificationsLabel: string;
    stateLabel: string;
    localityLabel: string;
    areaLabel: string;
    workplaceLabel: string;
    linkClinicLabel: string;
    independentClinicOption: string;
    servicesLabel: string;
    workingHoursLabel: string;
    workingDaysLabel: string;
    bioLabel: string;
    saveProfileBtn: string;
    submitProfileBtn: string;
    bookingsAnalyticsTitle: string;
    bookingsAnalyticsDesc: string;
    weekdayChartTitle: string;
    weekdayChartDesc: string;
    occupancyChartTitle: string;
    occupancyChartDesc: string;
    noOccupancyData: string;
    occupancyRateLabel: string;
    slotsWord: string;
    noBookings: string;
    colPatient: string;
    colDateTime: string;
    colReasonNote: string;
    colFee: string;
    colStatus: string;
    colAction: string;
    confirmBtn: string;
    attendedBtn: string;
    noShowBtn: string;
    cancelBtn: string;
    addEhrBtn: string;
    messagePatientBtn: string;
    ehrAuthorTitle: string;
    ehrAuthorDesc: string;
    authorizedPatientsTitle: string;
    newEhrFormTitle: string;
    noAuthorizedPatients: string;
    selectPatientOption: string;
    recordTypeLabel: string;
    recordTitleLabel: string;
    chiefComplaintLabel: string;
    diagnosisLabel: string;
    medicationsLabel: string;
    systolicLabel: string;
    diastolicLabel: string;
    glucoseLabel: string;
    nutritionSectionTitle: string;
    caloriesLabel: string;
    nutritionGoalLabel: string;
    mealGuidelinesLabel: string;
    activityPlanLabel: string;
    doctorNotesLabel: string;
    saveEhrBtn: string;
    recentEhrTitle: string;
    patientPrefix: string;
    authoredByPrefix: string;
    chartAttended: string;
    chartUpcoming: string;
    chartNoShow: string;
    liveArrivalsAlertTitle: string;
    liveArrivalsAlertDesc: string;
    openTodayTasksBtn: string;
    arrivedAtPrefix: string;
    weeklyChartTitle: string;
    weeklyChartDesc: string;
    monthlyChartTitle: string;
    monthlyChartDesc: string;
    yearLabel: string;
    busiestWeekLabel: string;
    busiestMonthLabel: string;
    totalBookedWord: string;
    chartBooked: string;
    dailySlotsChartTitle: string;
    dailySlotsChartDesc: string;
    dailySlotsCountLabel: string;
    dailySlotsTotalLabel: string;
    dailySlotsPeakLabel: string;
    noDailySlotsData: string;
    availabilityTitle: string;
    availabilityDesc: string;
    statusAvailable: string;
    statusBusy: string;
    toggleToBusyBtn: string;
    toggleToAvailableBtn: string;
    scanQrBtn: string;
  };
  clinic: {
    gateTitle: string;
    gateDesc: string;
    signInBtn: string;
    activeCenterLabel: string;
    registerNewClinicBtn: string;
    tabCenter: string;
    tabTodayTasks: string;
    tabStaff: string;
    tabAppointments: string;
    isolationNotice: string;
    newCenterTitle: string;
    editCenterTitle: string;
    centerFormDesc: string;
    centerNameLabel: string;
    centerTypeLabel: string;
    licenseLabel: string;
    phoneLabel: string;
    workingHoursLabel: string;
    stateLabel: string;
    localityLabel: string;
    areaLabel: string;
    addressLabel: string;
    servicesLabel: string;
    submitCenterBtn: string;
    saveCenterBtn: string;
    registerClinicFirst: string;
    addStaffTitle: string;
    staffRoleLabel: string;
    roleDoctor: string;
    roleManager: string;
    roleReceptionist: string;
    roleNurse: string;
    selectApprovedDocLabel: string;
    selectApprovedDocOption: string;
    staffNameLabel: string;
    permissionsLabel: string;
    addStaffBtn: string;
    addingStaff: string;
    staffListTitle: string;
    noStaffYet: string;
    rolePrefix: string;
    permissionsPrefix: string;
    activeRevokeBtn: string;
    revokedRestoreBtn: string;
    appointmentsTitle: string;
    appointmentsDescPrefix: string;
    noAppointments: string;
    colPatient: string;
    colDoctor: string;
    colAppointment: string;
    colFee: string;
    colStatus: string;
    colAction: string;
    liveArrivalsAlertTitle: string;
    liveArrivalsAlertDesc: string;
    openTodayTasksBtn: string;
    arrivedAtPrefix: string;
    analyticsTitle: string;
    analyticsDesc: string;
    weeklyChartTitle: string;
    weeklyChartDesc: string;
    monthlyChartTitle: string;
    monthlyChartDesc: string;
    yearLabel: string;
    busiestWeekLabel: string;
    busiestMonthLabel: string;
    totalBookedWord: string;
    chartAttended: string;
    chartUpcoming: string;
    chartBooked: string;
    dailySlotsChartTitle: string;
    dailySlotsChartDesc: string;
    dailySlotsCountLabel: string;
    dailySlotsTotalLabel: string;
    dailySlotsPeakLabel: string;
    noDailySlotsData: string;
    permissions: Record<string, string>;
    scanQrBtn: string;
  };
  admin: {
    restrictedTitle: string;
    restrictedDesc: string;
    dashboardTitle: string;
    dashboardDesc: string;
    seedDataBtn: string;
    seedingData: string;
    kpiDoctors: string;
    kpiClinics: string;
    kpiActivePatients: string;
    kpiTotalBookings: string;
    kpiOpenComplaints: string;
    approvedWord: string;
    pendingWord: string;
    totalAccountsSuffix: string;
    acrossAllStates: string;
    pendingApprovalsSuffix: string;
    tabOverview: string;
    tabApprovals: string;
    tabUsers: string;
    tabComplaintsReviews: string;
    tabAudit: string;
    loadingData: string;
    stateChartTitle: string;
    stateChartDesc: string;
    noStateChartData: string;
    approvalPieTitle: string;
    approvalPieDesc: string;
    noApprovalPieData: string;
    compositionTitle: string;
    compositionDesc: string;
    stateTableTitle: string;
    noDataAvailable: string;
    colState: string;
    colDoctors: string;
    colClinics: string;
    colBookings: string;
    doctorsQueueTitle: string;
    noDoctorsRegistered: string;
    clinicsQueueTitle: string;
    noClinicsRegistered: string;
    colDoctorSpecialty: string;
    colLicenseQual: string;
    colStateFee: string;
    colStatus: string;
    colDecision: string;
    colCenterType: string;
    colHealthLicense: string;
    colStateLocality: string;
    approveBtn: string;
    rejectBtn: string;
    suspendBtn: string;
    usersTitle: string;
    colUser: string;
    colEmail: string;
    colRole: string;
    colAction: string;
    activeUser: string;
    suspendedUser: string;
    suspendAccountBtn: string;
    reactivateAccountBtn: string;
    complaintsTitle: string;
    noComplaints: string;
    statusPrefix: string;
    resolutionPrefix: string;
    resolveComplaintBtn: string;
    reviewsTitle: string;
    noReviews: string;
    noComment: string;
    hideReviewBtn: string;
    republishReviewBtn: string;
    auditTitle: string;
    noAuditLogs: string;
    colActorRole: string;
    colOperation: string;
    colTarget: string;
    colDetails: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    confirmDecisionBtn: string;
    chartDoctors: string;
    chartClinics: string;
    chartBookings: string;
    chartCount: string;
    pieApproved: string;
    piePending: string;
    pieRejectedSuspended: string;
    compPatients: string;
    compDoctors: string;
    compClinics: string;
    compBookings: string;
  };
  tasks: {
    title: string;
    doctorDesc: string;
    clinicDesc: string;
    scopeUpcomingToday: string;
    scopeTodayOnly: string;
    scopeAllDone: string;
    kpiToday: string;
    kpiUpcoming: string;
    kpiAttended: string;
    kpiNoShow: string;
    kpiArrivedWaiting: string;
    loading: string;
    emptyTitle: string;
    emptyDesc: string;
    todayBadge: string;
    arrivedBannerBadge: string;
    arrivedAtPrefix: string;
    arrivedNote: string;
    visitReasonPrefix: string;
    generalConsult: string;
    feePrefix: string;
    confirmBtn: string;
    attendedBtn: string;
    noShowBtn: string;
    completedNote: string;
    noShowNote: string;
    ehrBtn: string;
    messageBtn: string;
  };
  chat: {
    patientTitle: string;
    doctorTitle: string;
    patientDesc: string;
    doctorDesc: string;
    secureBadge: string;
    startNewTitle: string;
    availableSuffix: string;
    selectDoctorPlaceholder: string;
    selectPatientPlaceholder: string;
    openBtn: string;
    noThreadsYet: string;
    newThreadBadge: string;
    youPrefix: string;
    emptyStateTitle: string;
    emptyStateDescPatient: string;
    emptyStateDescDoctor: string;
    appointmentBadgePrefix: string;
    noMessagesYet: string;
    roleDoctor: string;
    rolePatient: string;
    refPlaceholder: string;
    messagePlaceholder: string;
    sendBtn: string;
    sendingBtn: string;
    nowLabel: string;
  };
  reminders: {
    ariaLabel: string;
    previewTitle: string;
    autoTitle: string;
    closeAria: string;
    whatsappEnabledNote: string;
    detailsBtn: string;
    whatsappBtn: string;
    dismissBtn: string;
    medAutoTitle: string;
    medPreviewTitle: string;
    medDoseTimeLabel: string;
    medMarkTakenBtn: string;
    medOpenMedsBtn: string;
    medPreDose15Title: string;
    medDueInMinsSuffix: string;
    urgent30MinTitle: string;
  };
  whatsapp: {
    title: string;
    subtitle: string;
    savedSuccess: string;
    invalidPhoneError: string;
    saveError: string;
    phoneLabel: string;
    validPreviewPrefix: string;
    invalidPreview: string;
    enableWaTitle: string;
    enableWaDesc: string;
    enableToastTitle: string;
    enableToastDesc: string;
    saveBtn: string;
    darkModeTitle: string;
    darkModeDesc: string;
    darkModeOn: string;
    darkModeOff: string;
  };
  pdf: {
    modalTitle: string;
    modalSubtitle: string;
    printBtn: string;
    downloadBtn: string;
    downloadJsonBtn: string;
    generatingBtn: string;
    headerEyebrow: string;
    reportTitle: string;
    reportSubtitle: string;
    exportDateLabel: string;
    sec1Title: string;
    fullNameLabel: string;
    dobLabel: string;
    bloodTypeLabel: string;
    heightWeightBmiLabel: string;
    allergiesLabel: string;
    noAllergies: string;
    chronicLabel: string;
    noChronic: string;
    emergencyLabel: string;
    sec2Title: string;
    noPastVisits: string;
    colDate: string;
    colDoctorSpec: string;
    colClinicLoc: string;
    colTypeReason: string;
    sec3Title: string;
    noReports: string;
    complaintPrefix: string;
    diagnosisPrefix: string;
    medsPrefix: string;
    notesPrefix: string;
    nutritionPrefix: string;
    sec4Title: string;
    noVitals: string;
    colSource: string;
    colBp: string;
    colWeight: string;
    colGlucose: string;
    colHr: string;
    footerNote: string;
    cmUnit: string;
    kgUnit: string;
    notRecorded: string;
    notSpecified: string;
  };
  apps: {
    switchAppLabel: string;
    hubEyebrow: string;
    hubTitle: string;
    hubDesc: string;
    activeAppBadge: string;
    openAppBtn: string;
    copyAppLinkBtn: string;
    linkCopied: string;
    directLinkLabel: string;
    copyDoctorLinkBtn: string;
    copyClinicLinkBtn: string;
    openLinkBtn: string;
    copyBtn: string;
    bannerAlt: string;
    backToMainBtn: string;
    main: {
      title: string;
      shortName: string;
      subtitle: string;
      desc: string;
      openDirBtn: string;
      openAdminBtn: string;
    };
    provider: {
      title: string;
      shortName: string;
      subtitle: string;
      desc: string;
      registerDoctorBtn: string;
      registerClinicBtn: string;
      separationTitle: string;
      separationDesc: string;
      doctorTrackTitle: string;
      doctorTrackDesc: string;
      doctorTrackCtaSignedOut: string;
      doctorTrackCtaSwitch: string;
      doctorTrackOpenBtn: string;
      doctorTrackActiveBadge: string;
      clinicTrackTitle: string;
      clinicTrackDesc: string;
      clinicTrackCtaSignedOut: string;
      clinicTrackCtaSwitch: string;
      clinicTrackOpenBtn: string;
      clinicTrackActiveBadge: string;
    };
    patient: {
      title: string;
      shortName: string;
      subtitle: string;
      desc: string;
      openPortalBtn: string;
      openBookingBtn: string;
    };
  };
  pwa: {
    installAppBtn: string;
    installOnIosBtn: string;
    iosModalTitle: string;
    iosStep1: string;
    iosStep2: string;
    offlineBanner: string;
  };
  qr: {
    scannerBadge: string;
    scannerTitle: string;
    scannerDesc: string;
    startCameraBtn: string;
    stopCameraBtn: string;
    uploadImageBtn: string;
    manualPlaceholder: string;
    lookupBtn: string;
    lookingUp: string;
    generating: string;
    copied: string;
    cameraUnavailable: string;
    cameraPermissionDenied: string;
    decodeImageFailed: string;
    invalidPayload: string;
    notFoundError: string;
    retrievedAppointmentTitle: string;
    retrievedEhrTitle: string;
    patientLabel: string;
    doctorLabel: string;
    clinicLabel: string;
    dateTimeLabel: string;
    feeLabel: string;
    reasonLabel: string;
    markArrivedBtn: string;
    statusUpdatedMsg: string;
  };
}

export const translations: Record<AppLang, TranslationSchema> = {
  ar: {
    common: {
      platformName: 'المنصة الطبية السودانية الذكية',
      platformTagline: 'الرعاية الصحية الرقمية الموحدة في جميع ولايات السودان',
      loading: 'جاري التحميل...',
      initializing: 'جاري تهيئة المنصة...',
      close: 'إغلاق',
      cancel: 'إلغاء',
      save: 'حفظ',
      saving: 'جاري الحفظ...',
      submit: 'إرسال',
      submitting: 'جاري الإرسال...',
      all: 'الكل',
      newLabel: 'جديد',
      privateClinic: 'عيادة خاصة',
      notSpecified: 'غير محدد',
      yearsSuffix: 'سنة',
      reviewsCountSuffix: 'تقييم',
      starsSuffix: 'نجوم',
      signIn: 'تسجيل الدخول',
      signInWithGoogle: 'تسجيل الدخول بحساب Google',
      signingIn: 'جاري الدخول...',
      signOut: 'تسجيل الخروج',
      suspendedTitle: 'تم تعليق هذا الحساب مؤقتاً من الإدارة المركزية',
      suspendedReasonPrefix: 'سبب التعليق: ',
      suspendedDefaultMsg: 'يرجى التواصل مع الإدارة المركزية للمنصة لمراجعة إجراءات الحساب.',
      authInitError: 'تعذر تهيئة بيانات الحساب.',
      authSignInError: 'تعذر تسجيل الدخول. يرجى المحاولة مجدداً.',
    },
    quota: {
      bannerText: 'تم تجاوز حصة العرض التجريبي لخرائط Google أو تعذر التحقق من المفتاح مؤقتاً. تظهر مواقع العيادات بالبيانات الجغرافية المحلية.',
      learnMore: 'تفاصيل الحصة والمفاتيح',
    },
    nav: {
      directory: 'الدليل الطبي',
      patient: 'بوابة المريض',
      doctor: 'بوابة الطبيب',
      clinic: 'العيادات والمراكز',
      admin: 'الإدارة المركزية',
      whatsappActive: 'واتساب مفعل',
      linkWhatsapp: 'ربط واتساب',
      whatsappActiveLong: 'إشعارات واتساب مفعلة',
      linkWhatsappLong: 'ربط رقم الهاتف وتفعيل واتساب',
      whatsappSettingsTitle: 'ربط الهاتف وإشعارات واتساب',
      navMenuAria: 'قائمة التنقل',
      signOutShort: 'خروج',
      switchLangLabel: 'EN',
      switchLangAria: 'Switch language to English',
      darkModeToggleTitle: 'تبديل الوضع الليلي',
      darkModeOn: 'الوضع الليلي مفعل',
      darkModeOff: 'الوضع النهاري مفعل',
    },
    footer: {
      copyright: '© 2026 المنصة الطبية السودانية الذكية · جميع ولايات السودان',
    },
    directory: {
      heroEyebrow: 'شبكة الرعاية الصحية المعتمدة في جميع ولايات السودان',
      heroTitle: 'وصول موثوق للأطباء المعتمدين وإدارة موحدة لملفك الطبي',
      heroDesc: 'منصة رقمية موحدة تربط المرضى بالأطباء والعيادات والمراكز الطبية المعتمدة مركزياً في ولايات السودان الثماني عشرة، مع حجز المواعيد وإدارة الملفات الطبية الإلكترونية بخصوصية تامة.',
      heroFindDoctorBtn: 'ابحث عن طبيب معتمد',
      heroJoinBtn: 'انضمام الأطباء والعيادات',
      heroImgAlt: 'المركز الطبي الحديث في المنصة الطبية السودانية الذكية',
      statStatesSuffix: 'ولاية',
      statStatesDesc: 'تغطية جغرافية بالولاية والمحلية والمنطقة',
      statDoctorsSuffix: 'طبيب معتمد',
      statDoctorsDesc: 'مراجعة وتوثيق التراخيص قبل النشر',
      statClinicsSuffix: 'مركز وعيادة',
      statClinicsDesc: 'فصل كامل لبيانات وصلاحيات كل عيادة',
      statEhrTitle: 'ملف طبي موحد',
      statEhrDesc: 'الزيارات، الوصفات، القياسات، وخطط التغذية',
      sectionTitle: 'الدليل الطبي المعتمد في السودان',
      sectionDesc: 'يظهر في هذا الدليل الأطباء والعيادات الذين تم اعتماد مستنداتهم وتراخيصهم من الإدارة المركزية فقط.',
      tabDoctors: 'الأطباء المعتمدون',
      tabClinics: 'العيادات والمراكز',
      allSpecialties: 'جميع التخصصات',
      liveSearchLabel: 'البحث الحي (الاسم، الخدمة، المؤهل)',
      liveSearchPlaceholder: 'ابحث باسم الطبيب، العيادة، الخدمة...',
      specialtyLabel: 'التخصص الطبي',
      stateLabel: 'الولاية',
      allStatesOption: 'جميع ولايات السودان (18)',
      localityLabel: 'المحلية',
      allLocalitiesOption: 'جميع المحليات',
      hideAdvancedFilters: 'إخفاء الفلاتر المتقدمة',
      showAdvancedFilters: 'عرض الفلاتر المتقدمة',
      liveResultsPrefix: 'النتائج الحية:',
      liveResultsOf: 'من أصل',
      clearFilters: 'مسح جميع الفلاتر',
      areaLabel: 'الحي أو المنطقة',
      areaPlaceholder: 'العمارات، المهندسين، الرياض...',
      maxFeeLabel: 'الحد الأقصى لرسوم الكشف',
      anyFee: 'أي رسوم',
      upToFee: 'حتى',
      genderFilterLabel: 'الطبيب / الطبيبة',
      maleDoctor: 'طبيب',
      femaleDoctor: 'طبيبة',
      workingDayLabel: 'يوم العمل المتاح',
      allDays: 'جميع الأيام',
      sortByLabel: 'ترتيب النتائج',
      sortHighestRated: 'الأعلى تقييماً',
      sortLowestFee: 'الأقل رسوماً',
      sortMostExperienced: 'الأكثر سنوات خبرة',
      noDoctorsTitle: 'لا يوجد أطباء معتمدون مطابقون لنطاق البحث الحالي',
      noDoctorsDesc: 'يمكنك توسيع نطاق الولاية أو التخصص، أو إذا كنت من الإدارة المركزية يمكنك تهيئة بيانات الولايات المرجعية من لوحة الإدارة.',
      showAllStatesBtn: 'عرض جميع الولايات والتخصصات',
      noClinicsTitle: 'لا توجد مراكز أو عيادات معتمدة مطابقة للبحث',
      noClinicsDesc: 'جرب تغيير الولاية أو المحلية أو مسح نص البحث.',
      experiencePrefix: 'خبرة',
      consultationFee: 'رسوم الكشف',
      viewAndBookBtn: 'عرض الملف والحجز',
      licenseLabel: 'ترخيص',
      servicesPrefix: 'الخدمات:',
      centerDetailsAndDoctors: 'تفاصيل المركز وأطباؤه',
      qualificationsAndLicense: 'المؤهلات والترخيص',
      workplaceAndState: 'جهة العمل والولاية',
      daysAndHours: 'أيام وساعات العمل',
      centralApprovalLabel: 'الاعتماد المركزي',
      approvedVerified: 'معتمد وموثق',
      providedServices: 'الخدمات المقدمة:',
      reviewsAndAvgTitle: 'متوسط التقييمات وآراء المرضى',
      noRecentTextReviews: 'لا توجد تعليقات نصية منشورة حديثاً بعد — التقييم الإجمالي المعتمد:',
      overallApprovedRating: 'التقييم المعتمد',
      bookAppointmentTitle: 'حجز موعد طبي',
      signInToBookPrompt: 'يرجى تسجيل الدخول بحساب المريض لإتمام حجز الموعد ومتابعة ملفك الطبي.',
      signInNowBtn: 'تسجيل الدخول الآن',
      appointmentDateLabel: 'تاريخ الموعد',
      timeSlotLabel: 'الفترة الزمنية',
      visitTypeLabel: 'نوع الزيارة',
      visitReasonLabel: 'سبب الزيارة أو الأعراض الأولية (اختياري)',
      visitReasonPlaceholder: 'اكتب بإيجاز سبب الكشف لتجهيز الملف الطبي...',
      bookingSuccessMsg: 'تم إرسال طلب الحجز بنجاح. يمكنك متابعة تأكيد الموعد من بوابة المريض.',
      bookingErrorMsg: 'تعذر إتمام الحجز. يرجى المحاولة مرة أخرى.',
      viewMyBookings: 'عرض حجوزاتي',
      confirmBookingBtn: 'تأكيد طلب الحجز',
      sendingBooking: 'جاري إرسال الحجز...',
      geoLocationLabel: 'الموقع الجغرافي',
      hoursAndPhoneLabel: 'ساعات العمل والهاتف',
      availableMedicalServices: 'الخدمات الطبية المتوفرة',
      clinicPatientReviews: 'تقييمات المرضى للمركز',
      averagePrefix: 'المتوسط:',
      noRecentClinicReviews: 'لا توجد تعليقات نصية حديثة لهذا المركز بعد.',
      linkedApprovedDoctors: 'الأطباء المعتمدون المرتبطون بالمركز',
      noLinkedDoctors: 'لا يوجد أطباء مرتبطون مباشرة بهذا المعرف حالياً.',
      bookAppointmentBtn: 'حجز موعد',
      voiceSearchStartAria: 'البحث الصوتي عن طبيب أو تخصص',
      voiceSearchStopAria: 'إيقاف البحث الصوتي',
      voiceSearchListening: 'جاري الاستماع... تحدث الآن باسم الطبيب أو التخصص',
      voiceSearchUnsupported: 'متصفحك الحالي لا يدعم ميزة البحث الصوتي (Web Speech API). جرّب Chrome أو Edge.',
      voiceSearchDenied: 'تم رفض إذن الميكروفون. يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.',
      voiceSearchNoSpeech: 'لم يتم التقاط صوت واضح، يرجى المحاولة مرة أخرى.',
      voiceSearchError: 'تعذر إكمال البحث الصوتي حالياً، يرجى المحاولة مجدداً.',
      clearSearchAria: 'مسح نص البحث',
      availableNowBtn: 'متاح الآن (خلال 24 ساعة)',
      availableNowCountSuffix: 'طبيب متاح فوراً',
      urgentOpenSlotPrefix: 'موعد شاغر خلال 24 ساعة:',
      bookedSlotDisabled: 'محجوز',
      favoriteAdd: 'إضافة للمفضلة',
      favoriteRemove: 'إزالة من المفضلة',
      favoriteSignInPrompt: 'يرجى تسجيل الدخول لإضافة الأطباء والعيادات إلى قائمتك المفضلة.',
      geoFilterTitle: 'التصفية حسب المنطقة الجغرافية والولاية',
      regionLabel: 'المنطقة الجغرافية',
      allRegionsOption: 'كل مناطق السودان',
      allRegionStatesOption: 'كل ولايات المنطقة المحددة',
      doctorsShortSuffix: 'طبيب',
      clinicsShortSuffix: 'مركز',
      statusAvailableBadge: 'متاح الآن',
      statusBusyBadge: 'مشغول حالياً',
    },
    map: {
      sectionTitle: 'الخريطة التفاعلية للعيادات والمراكز المعتمدة',
      sectionDesc: 'تصفح مواقع العيادات والمراكز الطبية المعتمدة في جميع ولايات السودان؛ اضغط على الدبوس لعرض تفاصيل المركز أو التوجه إليه مباشرة.',
      toggleShow: 'إظهار الخريطة',
      toggleHide: 'إخفاء الخريطة',
      resetView: 'عرض كل السودان',
      approvedCentersCount: 'مركز معتمد على الخريطة',
      allSudanStates: 'جميع ولايات السودان',
      stateFilterActive: 'الولاية المحددة:',
      regionFilterActive: 'المنطقة الجغرافية:',
      centerListTitle: 'المراكز المعتمدة الظاهرة',
      noClinicsOnMap: 'لا توجد عيادات أو مراكز مطابقة للفلترة الحالية لعرضها على الخريطة.',
      doctorsCountSuffix: 'طبيب معتمد',
      clickPinHint: 'اضغط على الدبوس في الخريطة أو اختر مركزاً من القائمة',
      viewCenterDetails: 'تفاصيل المركز وأطباؤه',
      getDirections: 'التوجه إلى المركز',
      missingKeyTitle: 'مفتاح خرائط Google غير مهيأ بعد في البيئة',
      missingKeyDesc: 'يمكنك تصفح مواقع المراكز وتفاصيلها والتوجه إليها عبر الروابط أدناه.',
      loadErrorTitle: 'تعذر تحميل خريطة Google التفاعلية حالياً',
      loadErrorDesc: 'تحقق من الاتصال أو قيود المفتاح، ويمكنك فتح الاتجاهات مباشرة لكل مركز من القائمة المجاورة.',
      approxLocationNote: 'إحداثيات مركزية للولاية / المحلية',
      verifiedPlaceNote: 'موقع موثق عبر خرائط Google',
    },
    patient: {
      portalLabel: 'بوابة المريض',
      gateTitle: 'بوابة المريض والملف الطبي الإلكتروني',
      gateDesc: 'سجل الدخول للوصول إلى مواعيدك الطبية، متابعة تشخيصاتك ووصفاتك الدوائية، وإدارة صلاحيات اطلاع الأطباء على ملفك الطبي.',
      tabAppointments: 'حجوزاتي ومواعيدي',
      tabReminders: 'التنبيهات والإعدادات',
      tabFavorites: 'قائمة المفضلة',
      tabEhr: 'الملف الطبي الإلكتروني',
      tabMessages: 'الرسائل مع الأطباء',
      tabConsent: 'صلاحيات الاطلاع والخصوصية',
      tabComplaints: 'الشكاوى والبلاغات',
      remindersTitle: 'التنبيهات التلقائية وإشعارات واتساب للمواعيد',
      remindersDesc: 'اربط رقم هاتفك لتفعيل إشعارات واتساب بجانب التنبيهات المرئية (Toast) داخل التطبيق قبل الموعد بـ 24 ساعة.',
      toastOnBtn: 'إشعارات التطبيق مفعلة · إيقاف',
      toastOffBtn: 'إشعارات التطبيق متوقفة · تفعيل',
      waCardTitle: 'ربط رقم الهاتف وإشعارات واتساب (خارج المنصة)',
      waCardDesc: 'تصل تنبيهات المواعيد والتذكير عبر تطبيق واتساب لضمان عدم فوات أي زيارة طبية.',
      waLinkedBadge: 'إشعارات واتساب مفعلة',
      waNotLinkedBadge: 'غير مرتبط بعد',
      waPhoneLabel: 'رقم الهاتف المرتبط بواتساب',
      waPhoneValidPrefix: 'الصيغة الدولية المعتمدة:',
      waPhoneInvalid: 'الرجاء إدخال رقم صحيح (مثال: 0912345678 أو +249912345678)',
      waCheckboxTitle: 'تفعيل تذكيرات واتساب التلقائية',
      waCheckboxDesc: 'إرفاق زر إرسال وتنبيه مباشر لرقمك المرتبط في جميع تذكيرات المواعيد.',
      toastCheckboxTitle: 'تفعيل إشعارات التطبيق (Toast Notifications)',
      toastCheckboxDesc: 'إظهار إشعارات منبثقة داخل المنصة قبل الموعد بـ 24 ساعة.',
      savePhoneAndPrefs: 'حفظ رقم الهاتف وتفضيلات الإشعارات',
      upcoming24hHeader: 'المواعيد ضمن نافذة التذكير (أقل من 24 ساعة):',
      noUpcoming24h: 'لا توجد مواعيد خلال الـ 24 ساعة القادمة حالياً.',
      previewNearestToast: 'معاينة إشعار التذكير لأقرب موعد قادم',
      sendViaWhatsapp: 'إرسال عبر واتساب',
      showAppToast: 'إظهار إشعار التطبيق',
      copyReminderText: 'نسخ نص التذكير',
      copied: 'تم النسخ',
      appointmentsTitle: 'متابعة الحجوزات والنشاط الصحي الشهري',
      appointmentsDesc: 'راقب زياراتك الطبية الشهرية خلال السنة، وتابع مواعيدك وقيّم الأطباء والعيادات بعد الزيارة.',
      bookNewAppointment: 'حجز موعد جديد',
      upcoming24hAlertTitle: 'لديك مواعيد قادمة خلال الـ 24 ساعة المقبلة:',
      nearestAppointmentLabel: 'أقرب موعد:',
      showVisualAlert: 'عرض التنبيه المرئي',
      loyaltyHeader: 'نظام نقاط الرعاية الصحية · المستوى',
      loyaltyUnit: 'نقطة صحية',
      progressTowards: 'التقدم نحو مستوى',
      maxTierReached: 'وصلت إلى أعلى مستوى للعضوية الصحية في المنصة',
      visitsPointsSummary: 'زيارة مكتملة',
      reviewsPointsSummary: 'تقييم مقدم',
      pointsRemainingPrefix: 'متبقي',
      pointsRemainingSuffix: 'نقطة للترقية',
      annualActivityTitle: 'النشاط الصحي الشهري: عدد الزيارات الطبية خلال سنة',
      annualActivityDesc: 'مقارنة شهرية بين الزيارات المكتملة والمواعيد المؤكدة أو المنتظرة على مدار 12 شهراً.',
      yearLabel: 'السنة:',
      totalYearVisits: 'إجمالي الزيارات',
      completedVisits: 'زيارات مكتملة',
      scheduledVisits: 'مواعيد مجدولة / قادمة',
      peakMonth: 'أكثر شهر نشاطاً',
      chartCompleted: 'زيارات مكتملة',
      chartScheduled: 'مواعيد مجدولة',
      noYearVisits: 'لا توجد زيارات طبية مسجلة خلال هذه السنة حتى الآن — ستظهر الأعمدة تلقائياً عند حجز أو إتمام مواعيدك.',
      pendingReviewsTitle: 'مواعيد مكتملة بانتظار تقييمك للطبيب والعيادة',
      rateDoctorAndClinic: 'تقييم الطبيب والعيادة',
      noAppointmentsTitle: 'لا توجد مواعيد محجوزة حتى الآن',
      noAppointmentsDesc: 'استعرض الأطباء المعتمدين في ولايتك لحجز أول استشارة طبية.',
      browseDirectory: 'تصفح الدليل الطبي',
      colDoctorSpecialty: 'الطبيب والتخصص',
      colCenterState: 'المركز والولاية',
      colDateTime: 'التاريخ والوقت',
      colTypeFee: 'النوع والرسوم',
      colStatus: 'الحالة',
      colActions: 'إجراءات',
      messageDoctorBtn: 'مراسلة الطبيب',
      reviewedLabel: 'تم التقييم',
      myReviewsTitle: 'تقييماتي المنشورة للأطباء والعيادات',
      clinicRatingLabel: 'تقييم العيادة',
      ehrTitle: 'الملف الطبي الإلكتروني الموحد',
      ehrDesc: 'سجل الزيارات السابقة، تقارير الأطباء التشخيصية، الأدوية الحالية، تطور ضغط الدم والوزن، والبيانات الصحية الأساسية.',
      exportPdfBtn: 'تصدير السجل الطبي (PDF)',
      exportJsonBtn: 'تنزيل السجل (JSON)',
      downloadAppointmentsPdfBtn: 'تنزيل المواعيد (PDF)',
      downloadAppointmentsJsonBtn: 'تنزيل المواعيد (JSON)',
      jsonExportSuccess: 'تم تنزيل الملف بصيغة JSON محلياً على جهازك.',
      printEhrBtn: 'طباعة',
      printReportHeader: 'المنصة الطبية السودانية الذكية · طباعة الملف الطبي للمريض',
      printGeneratedLabel: 'تاريخ الطباعة:',
      ehrFilterAll: 'العرض الشامل',
      ehrFilterVisits: 'سجل الزيارات',
      ehrFilterReports: 'التقارير التشخيصية',
      ehrFilterMedications: 'الأدوية الحالية',
      ehrFilterVitals: 'تطور المؤشرات الصحية',
      ehrFilterProfile: 'البيانات الأساسية وتسجيل القياس',
      pastVisitsTitle: 'سجل الزيارات الطبية السابقة',
      pastVisitsDesc: 'الجدول الزمني للزيارات الطبية المكتملة والاستشارات الموثقة في ملفك.',
      visitsUnit: 'زيارة',
      noPastVisits: 'لا توجد زيارات طبية مكتملة مسجلة بعد. ستظهر زياراتك السابقة هنا بمجرد إتمام الكشف الطبي.',
      colVisitDate: 'تاريخ الزيارة',
      colClinicLocation: 'العيادة والموقع',
      colTypeReason: 'نوع الزيارة والسبب',
      colReport: 'التقرير التشخيصي',
      viewReportBtn: 'عرض التقرير',
      completedWord: 'مكتملة',
      diagnosticReportsTitle: 'تقارير الأطباء التشخيصية والوصفات السابقة',
      diagnosticReportsDesc: 'التشخيصات الطبية، نتائج الاستشارات، الأدوية الموصوفة، والخطط الغذائية المسجلة من أطبائك.',
      noDiagnosticReports: 'لا توجد تقارير تشخيصية مسجلة من الأطباء بعد. ستظهر هنا جميع التقارير والوصفات بعد زياراتك.',
      chiefComplaintLabel: 'الشكوى الرئيسية:',
      diagnosisLabel: 'التشخيص الطبي:',
      medicationsLabel: 'الأدوية والوصفات:',
      vitalsTitle: 'تطور المؤشرات الصحية (ضغط الدم والوزن) في جداول زمنية',
      vitalsDesc: 'تتبع تاريخي لقراءات ضغط الدم، الوزن، سكر الدم، والنبض سواء المسجلة في العيادة أو ذاتياً.',
      readingsCountSuffix: 'قراءة مسجلة',
      noVitalsYet: 'لا توجد قراءات حيوية مسجلة بعد لعرض الجدول الزمني.',
      addFirstVitalsBtn: 'تسجيل أول قراءة للضغط والوزن',
      bpChartTitle: 'منحنى تطور ضغط الدم (mmHg)',
      weightChartTitle: 'منحنى تطور الوزن (كجم)',
      bpSystolic: 'الانقباضي',
      bpDiastolic: 'الانبساطي',
      weightLabel: 'الوزن (كجم)',
      colDate: 'التاريخ',
      colSourceDesc: 'المصدر / الوصف',
      colBp: 'ضغط الدم (mmHg)',
      colBpStatus: 'تقييم الضغط',
      colWeight: 'الوزن (كجم)',
      colDelta: 'التغير',
      colGlucose: 'السكر (mg/dL)',
      colHeartRate: 'النبض (bpm)',
      baselineTitle: 'البيانات الطبية الأساسية',
      bmiLabel: 'مؤشر كتلة الجسم (BMI):',
      fullNameLabel: 'الاسم الكامل',
      dobLabel: 'تاريخ الميلاد',
      bloodTypeLabel: 'فصيلة الدم',
      genderLabel: 'الجنس',
      male: 'ذكر',
      female: 'أنثى',
      heightLabel: 'الطول (سم)',
      weightInputLabel: 'الوزن (كجم)',
      allergiesLabel: 'الحساسية الدوائية أو الغذائية (مفصولة بفاصلة)',
      chronicLabel: 'الأمراض المزمنة (مفصولة بفاصلة)',
      emergencyLabel: 'جهة الاتصال للطوارئ',
      saveBaselineBtn: 'حفظ البيانات الأساسية',
      selfMeasTitle: 'تسجيل القياسات الصحية اليومية (تظهر فوراً في الجدول الزمني)',
      measDescLabel: 'وصف القياس',
      measSystolicLabel: 'الضغط (انقباضي)',
      measDiastolicLabel: 'الضغط (انبساطي)',
      measGlucoseLabel: 'السكر (mg/dL)',
      measHrLabel: 'النبض (bpm)',
      measWeightLabel: 'الوزن (كجم)',
      addMeasBtn: 'إضافة القياس للسجل',
      consentTitle: 'إدارة صلاحيات الوصول للملف الطبي',
      consentDesc: 'لا يتم مشاركة ملفك الطبي أو سجلاتك السريرية مع أي طبيب إلا بموافقتك الصريحة هنا.',
      noConsentDoctors: 'لا يوجد أطباء معتمدون متاحون حالياً لمنح الصلاحية.',
      consentAuthorized: 'مصرح له · اضغط للسحب',
      consentGrant: 'منح صلاحية الاطلاع',
      complaintsTitle: 'الشكاوى والبلاغات الإدارية',
      complaintsDesc: 'تراجع الإدارة المركزية كافة الشكاوى لضمان جودة الرعاية الطبية والالتزام المهني.',
      complaintTargetLabel: 'جهة الشكوى',
      complaintTargetDoctor: 'طبيب',
      complaintTargetClinic: 'عيادة أو مركز طبي',
      complaintTargetPlatform: 'ملاحظة تقنية / إدارية بالمنصة',
      complaintTargetNameLabel: 'اسم الطبيب أو المركز المعني',
      complaintSubjectLabel: 'عنوان الشكوى',
      complaintDetailsLabel: 'التفاصيل',
      submitComplaintBtn: 'إرسال الشكوى للإدارة المركزية',
      adminReplyLabel: 'رد الإدارة:',
      reviewModalTitle: 'تقييم الطبيب والعيادة بعد الزيارة',
      reviewModalDatePrefix: 'موعد بتاريخ',
      rateDoctorTitle: 'تقييم الطبيب:',
      doctorCommentLabel: 'تعليقك حول الطبيب والاستشارة',
      doctorCommentPlaceholder: 'اكتب ملاحظاتك حول جودة الكشف والتعامل الطبي...',
      rateClinicTitle: 'تقييم العيادة / المركز:',
      clinicCommentLabel: 'تعليقك حول العيادة أو المركز الطبي (اختياري)',
      clinicCommentPlaceholder: 'اكتب ملاحظاتك حول الاستقبال، التنظيم، والنظافة...',
      publishReviewBtn: 'نشر التقييم',
      publishingReview: 'جاري النشر...',
      tiers: ['مشارك صحي جديد', 'عضو نشط', 'عضو متابع', 'عضو مميز', 'سفير العناية الصحية'],
      months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
      ratingLabels: { 1: 'ضعيف', 2: 'مقبول', 3: 'جيد', 4: 'جيد جداً', 5: 'ممتاز' },
      bpNormal: 'طبيعي',
      bpHigh: 'مرتفع',
      bpElevated: 'فوق الطبيعي',
      bpLow: 'منخفض',
      medicationsSectionTitle: 'الأدوية الحالية وتنبيهات الجرعات',
      medicationsSectionDesc: 'تابع أدويتك الحالية، حدّث حالة الاستخدام، واضبط أوقات الجرعات لتصلك تنبيهات موعد تناول الدواء.',
      medicationsAddToggleBtn: 'إضافة دواء جديد',
      medicationsEmpty: 'لا توجد أدوية مضافة في قائمة الأدوية الحالية بعد. يمكنك إضافة دواء يدوياً أو استيراده من تقارير الأطباء.',
      medicationsNameLabel: 'اسم الدواء',
      medicationsNamePlaceholder: 'مثال: Amoxicillin 500mg أو Metformin',
      medicationsDosageLabel: 'الجرعة',
      medicationsDosagePlaceholder: 'مثال: قرص واحد (500 ملغ)',
      medicationsFrequencyLabel: 'التكرار اليومي',
      medicationsFrequencyPlaceholder: 'مثال: كل 12 ساعة / مرتين يومياً',
      medicationsTimesLabel: 'أوقات تناول الدواء (بصيغة 24 ساعة مثل 08:00, 20:00)',
      medicationsTimesHint: 'اضغط على الأوقات الجاهزة أو اكتب أوقات الجرعات مفصولة بفاصلة.',
      medicationsStatusLabel: 'حالة الاستخدام',
      medicationsNotesLabel: 'ملاحظات (مثال: بعد الأكل)',
      medicationsNotesPlaceholder: 'بعد وجبة الإفطار والعشاء...',
      medicationsReminderCheck: 'تفعيل تنبيه موعد تناول الدواء (Toast)',
      medicationsSaveBtn: 'حفظ الدواء في القائمة',
      medicationsStatusActive: 'جاري الاستخدام',
      medicationsStatusPaused: 'موقوف مؤقتاً',
      medicationsStatusStopped: 'تم الإيقاف',
      medicationsPrescribedByLabel: 'وصفه:',
      medicationsDueNowBadge: 'حان موعد الجرعة',
      medicationsTakenTodayBadge: 'تم تناول جرعة اليوم',
      medicationsNoSchedule: 'بدون جدول ساعات محدد',
      medicationsNextDosePrefix: 'الجرعة القادمة:',
      medicationsMarkTakenBtn: 'تم تناول الجرعة',
      medicationsPreviewAlertBtn: 'تجربة التنبيه',
      medicationsReminderOn: 'التنبيه مفعل',
      medicationsReminderOff: 'التنبيه متوقف',
      medicationsDeleteBtn: 'حذف',
      medicationsFromReportsTitle: 'أدوية موصوفة من تقارير أطبائك (جاهزة للإضافة بضغطة زر)',
      medicationsFromReportsDesc: 'أضف أي دواء موصوف سابقاً لمتابعة حالته وتلقي تنبيهات الجرعات.',
      medicationsImportBtn: 'إضافة للأدوية الحالية',
      medicationsImportedMsg: 'تمت إضافة الدواء من وصفة الطبيب إلى قائمة الأدوية الحالية.',
      medicationsActiveAlertBanner: 'تذكير عاجل بموعد الدواء: لديك أدوية حان وقت جرعتها الآن.',
      checkInBtn: 'تأكيد الوصول للعيادة',
      checkingInBtn: 'جاري تسجيل الوصول...',
      checkedInBadge: 'تم تسجيل وصولك بالعيادة',
      checkedInAtPrefix: 'وقت الوصول:',
      checkInSuccessMsg: 'تم تأكيد وصولك للعيادة رقمياً وإشعار الطبيب ومكتب الاستقبال فوراً.',
      todayCheckInCardTitle: 'موعدك اليوم — تأكيد الوصول الرقمي عند الاستقبال',
      todayCheckInCardDesc: 'بمجرد وصولك إلى مقر العيادة، اضغط تأكيد الوصول لإعلام الطبيب والعيادة فوراً وتقليل وقت الانتظار.',
      waitingDoctorNotice: 'أنت الآن في قائمة انتظار الدخول لدى الطبيب',
      favoritesTitle: 'قائمة المفضلة للأطباء والعيادات',
      favoritesDesc: 'الأطباء والمراكز الطبية التي قمت بحفظها للوصول السريع وإعادة الحجز لاحقاً.',
      favoriteDoctorsTitle: 'الأطباء المفضلون',
      favoriteClinicsTitle: 'العيادات والمراكز المفضلة',
      noFavoritesTitle: 'قائمة المفضلة فارغة حالياً',
      noFavoritesDesc: 'اضغط على أيقونة القلب بجانب أي طبيب أو عيادة في الدليل الطبي لحفظها هنا.',
      removeFavoriteBtn: 'إزالة',
      nextDoseCardTitle: 'الجرعة القادمة من أدويتك النشطة',
      nextDosePre15Badge: 'متبقي أقل من 15 دقيقة على الجرعة',
      nextDoseNone: 'لا توجد جرعات مجدولة لأدوية نشطة حالياً.',
      nextDoseTakenTodayCount: 'أدوية نشطة قيد المتابعة:',
      darkModeSectionTitle: 'مظهر التطبيق — الوضع الليلي (Dark Mode)',
      darkModeSectionDesc: 'تعديل ألوان واجهة المنصة بالكامل إلى ألوان داكنة مريحة للعين وحفظ التفضيل في حسابك.',
      darkModeOnLabel: 'الوضع الليلي مفعل (مريح للعين)',
      darkModeOffLabel: 'الوضع النهاري القياسي مفعل',
      push30MinTitle: 'إشعارات الدفع الفورية قبل الموعد بـ 30 دقيقة (Web Push)',
      push30MinDesc: 'تلقي إشعار متصفح/نظام فوري قبل موعدك الطبي بـ 30 دقيقة تلقائياً حتى عند تصغير الصفحة.',
      pushEnableBtn: 'تفعيل إشعارات الدفع',
      pushEnabledBadge: 'إشعارات قبل 30 دقيقة مفعلة',
      pushBlockedBadge: 'الإذن محظور في المتصفح',
      pushUnsupportedBadge: 'المتصفح لا يدعم إشعارات الدفع',
      pushTestBtn: 'تجربة إشعار 30 دقيقة',
      pushTestSentMsg: 'تم إرسال تنبيه تجريبي لإشعار الموعد قبل 30 دقيقة.',
      pushToggleLabel: 'تفعيل التنبيه التلقائي قبل 30 دقيقة',
      appointmentQrBtn: 'رمز QR',
      ehrQrBtn: 'رمز QR للملف الطبي',
      qrAppointmentTitle: 'رمز QR الخاص بالموعد الطبي',
      qrAppointmentBadge: 'تذكرة موعد رقمية',
      qrEhrTitle: 'رمز QR للملف الطبي الطارئ',
      qrEhrBadge: 'بطاقة ملف طبي موحد',
      qrScanHint: 'أظهر هذا الرمز لموظف الاستقبال أو الطبيب لاسترجاع بيانات الموعد أو الملف فوراً.',
      qrDownloadPngBtn: 'تحميل PNG',
      qrCopyPayloadBtn: 'نسخ بيانات الرمز',
    },
    doctor: {
      portalLabel: 'بوابة الطبيب',
      gateTitle: 'بوابة الطبيب السودانية',
      gateDesc: 'أنشئ ملفك المهني وحدد تخصصك ومؤهلاتك ومكان عملك ورسوم الكشف، وسيتم نشر ملفك واستقبال الحجوزات فور اعتماد الطلب من الإدارة المركزية.',
      signInBtn: 'تسجيل الدخول لبوابة الطبيب',
      tabProfile: 'الملف المهني والاعتماد',
      tabTodayTasks: 'قائمة مهام اليوم',
      tabBookings: 'الحجوزات والتحليلات',
      tabEhrAuthor: 'السجلات الطبية والتغذية',
      tabMessages: 'رسائل المرضى',
      approvalStatusPrefix: 'حالة الاعتماد المركزي:',
      approvedNotice: 'ملفك منشور حالياً في نتائج البحث ومتاح لاستقبال الحجوزات.',
      pendingNotice: 'طلبك قيد المراجعة من الإدارة المركزية. لن يظهر ملفك للمرضى ولن يستقبل حجوزات حتى الاعتماد.',
      rejectedPrefix: 'التوضيح الإداري:',
      editProfileTitle: 'تحديث الملف المهني للطبيب',
      newProfileTitle: 'تقديم طلب اعتماد طبيب جديد',
      profileDesc: 'أدخل بياناتك المهنية ورقم قيد المجلس الطبي السوداني وتوزيع العمل الجغرافي.',
      fullNameLabel: 'الاسم المهني الكامل',
      genderLabel: 'النوع',
      male: 'طبيب',
      female: 'طبيبة',
      specialtyLabel: 'التخصص الطبي',
      licenseLabel: 'رقم الترخيص / القيد الطبي',
      expYearsLabel: 'سنوات الخبرة',
      feeSdgLabel: 'رسوم الكشف (ج.س)',
      qualificationsLabel: 'المؤهلات العلمية والشهادات',
      stateLabel: 'الولاية',
      localityLabel: 'المحلية',
      areaLabel: 'المنطقة / الحي',
      workplaceLabel: 'اسم مكان العمل / العيادة',
      linkClinicLabel: 'ربط بمركز طبي معتمد (اختياري)',
      independentClinicOption: 'عيادة مستقلة / بدون ربط',
      servicesLabel: 'الخدمات المقدمة (مفصولة بفاصلة)',
      workingHoursLabel: 'ساعات العمل',
      workingDaysLabel: 'أيام العمل الأسبوعية',
      bioLabel: 'نبذة مهنية موجزة',
      saveProfileBtn: 'حفظ التعديلات المهنية',
      submitProfileBtn: 'تقديم طلب الاعتماد',
      bookingsAnalyticsTitle: 'إدارة الحجوزات وتحليلات العيادات والأيام',
      bookingsAnalyticsDesc: 'توزيع المواعيد حسب أيام الأسبوع، نسبة الإشغال لكل عيادة، وإدارة الحضور والملفات الطبية.',
      weekdayChartTitle: 'توزيع المواعيد حسب أيام الأسبوع',
      weekdayChartDesc: 'مقارنة المواعيد التي تم حضورها والمواعيد القادمة وحالات الغياب عبر أيام الأسبوع.',
      occupancyChartTitle: 'نسبة الإشغال لكل عيادة يعمل بها الطبيب',
      occupancyChartDesc: 'محسوبة وفق الحجوزات النشطة والمكتملة مقارنة بالسعة الزمنية اليومية.',
      noOccupancyData: 'لا توجد عيادات أو حجوزات مسجلة لحساب نسبة الإشغال بعد.',
      occupancyRateLabel: 'نسبة الإشغال',
      slotsWord: 'خانة',
      noBookings: 'لا توجد حجوزات واردة حالياً.',
      colPatient: 'المريض',
      colDateTime: 'التاريخ والوقت',
      colReasonNote: 'السبب / الملاحظة',
      colFee: 'الرسوم',
      colStatus: 'الحالة',
      colAction: 'الإجراء',
      confirmBtn: 'تأكيد',
      attendedBtn: 'تم الحضور',
      noShowBtn: 'غائب',
      cancelBtn: 'إلغاء',
      addEhrBtn: 'إضافة سجل طبي',
      messagePatientBtn: 'مراسلة المريض',
      ehrAuthorTitle: 'إدارة الملفات الطبية والخطط الغذائية',
      ehrAuthorDesc: 'عرض السجلات المصرح لك بها، وتدوين التشخيصات، الوصفات الدوائية، القياسات، والخطط الغذائية والرياضية.',
      authorizedPatientsTitle: 'المرضى الذين منحوك صلاحية الاطلاع على بياناتهم الأساسية',
      newEhrFormTitle: 'تدوين زيارة / تشخيص / وصفة / خطة غذائية جديدة',
      noAuthorizedPatients: 'لا يوجد مرضى مرتبطون بحجوزاتك أو مصرحون لك بعد. بمجرد حجز مريض أو منحه الصلاحية سيظهر هنا.',
      selectPatientOption: 'اختر المريض',
      recordTypeLabel: 'نوع السجل الطبي',
      recordTitleLabel: 'عنوان السجل',
      chiefComplaintLabel: 'الشكوى الرئيسية',
      diagnosisLabel: 'التشخيص السريري',
      medicationsLabel: 'الأدوية والجرعات (مفصولة بفاصلة)',
      systolicLabel: 'الضغط الانقباضي',
      diastolicLabel: 'الضغط الانبساطي',
      glucoseLabel: 'سكر الدم (mg/dL)',
      nutritionSectionTitle: 'الخطة الغذائية والرياضية (عند الحاجة)',
      caloriesLabel: 'السعرات الحرارية المستهدفة يومياً',
      nutritionGoalLabel: 'الهدف العلاجي',
      mealGuidelinesLabel: 'إرشادات الوجبات الغذائية',
      activityPlanLabel: 'خطة النشاط البدني',
      doctorNotesLabel: 'ملاحظات الطبيب والتوصيات',
      saveEhrBtn: 'حفظ السجل في الملف الطبي',
      recentEhrTitle: 'السجلات الطبية المتاحة لك',
      patientPrefix: 'المريض:',
      authoredByPrefix: 'الطبيب المسجل:',
      chartAttended: 'تم الحضور',
      chartUpcoming: 'قادمة / مؤكدة',
      chartNoShow: 'غائب',
      liveArrivalsAlertTitle: 'مرضى حضروا للعيادة الآن وبانتظار الدخول',
      liveArrivalsAlertDesc: 'تم تأكيد وصولهم رقمياً — يتم التحديث تلقائياً في الوقت الفعلي لتقليل انتظار الاستقبال.',
      openTodayTasksBtn: 'فتح قائمة مهام اليوم',
      arrivedAtPrefix: 'حضر الساعة',
      weeklyChartTitle: 'عدد المواعيد المحجوزة أسبوعياً',
      weeklyChartDesc: 'تتبع حجم الحجوزات الأسبوعية (بداية الأسبوع السبت) لمساعدتك في تنظيم جدول العيادة.',
      monthlyChartTitle: 'عدد المواعيد المحجوزة شهرياً',
      monthlyChartDesc: 'ملخص المواعيد المحجوزة شهرياً على مدار السنة مقارنة بالحضور والقادمة.',
      yearLabel: 'السنة:',
      busiestWeekLabel: 'أكثر أسبوع ازدحاماً:',
      busiestMonthLabel: 'أكثر شهر نشاطاً:',
      totalBookedWord: 'إجمالي المواعيد المحجوزة',
      chartBooked: 'إجمالي المحجوزة',
      dailySlotsChartTitle: 'عدد المواعيد المحجوزة يومياً (من الخانات الزمنية bookedSlots)',
      dailySlotsChartDesc: 'توزيع عدد الخانات والمواعيد المحجوزة لكل يوم لتسهيل متابعة الضغط اليومي للعيادة.',
      dailySlotsCountLabel: 'مواعيد اليوم',
      dailySlotsTotalLabel: 'إجمالي الخانات المحجوزة:',
      dailySlotsPeakLabel: 'أكثر يوم ازدحاماً:',
      noDailySlotsData: 'لا توجد خانات مواعيد محجوزة مسجلة في هذه السنة حتى الآن.',
      availabilityTitle: 'حالة التوفر الفورية في الدليل الطبي',
      availabilityDesc: 'تحديث حالتك الفورية (متاح / مشغول) يظهر للمرضى مباشرة في الدليل الطبي لحظة بلحظة.',
      statusAvailable: 'متاح الآن',
      statusBusy: 'مشغول حالياً',
      toggleToBusyBtn: 'تبديل إلى مشغول',
      toggleToAvailableBtn: 'تبديل إلى متاح الآن',
      scanQrBtn: 'مسح رمز QR للموعد / المريض',
    },
    clinic: {
      gateTitle: 'بوابة العيادات والمراكز الطبية',
      gateDesc: 'سجل عيادتك أو مركزك الطبي في أي من ولايات السودان، أضف الأطباء المعتمدين والموظفين بصلاحيات معزولة تماماً، وتابع حجوزات المرضى.',
      signInBtn: 'تسجيل الدخول لإدارة المركز',
      activeCenterLabel: 'المركز الطبي النشط',
      registerNewClinicBtn: '+ تسجيل عيادة / مركز جديد',
      tabCenter: 'بيانات المركز والخدمات',
      tabTodayTasks: 'قائمة مهام اليوم',
      tabStaff: 'الأطباء والكادر',
      tabAppointments: 'حجوزات المركز',
      isolationNotice: 'بيانات هذا المركز وكادره معزولة بالكامل عن بقية العيادات عبر معرف العيادة الآمن.',
      newCenterTitle: 'تسجيل عيادة أو مركز طبي جديد',
      editCenterTitle: 'تحديث بيانات المركز الطبي',
      centerFormDesc: 'يخضع المركز لمراجعة التراخيص من الإدارة المركزية قبل إدراجه في نتائج البحث.',
      centerNameLabel: 'اسم العيادة أو المركز الطبي',
      centerTypeLabel: 'تصنيف المنشأة',
      licenseLabel: 'رقم الترخيص الصحي للمنشأة',
      phoneLabel: 'هاتف الاستقبال',
      workingHoursLabel: 'ساعات العمل',
      stateLabel: 'الولاية',
      localityLabel: 'المحلية',
      areaLabel: 'المنطقة / الحي',
      addressLabel: 'العنوان التفصيلي',
      servicesLabel: 'الخدمات والتخصصات المتوفرة (مفصولة بفاصلة)',
      submitCenterBtn: 'تقديم طلب تسجيل المركز',
      saveCenterBtn: 'حفظ تعديلات المركز',
      registerClinicFirst: 'يرجى تسجيل عيادة أو مركز طبي أولاً لإدارة الأطباء والكادر.',
      addStaffTitle: 'إضافة طبيب معتمد أو موظف إلى',
      staffRoleLabel: 'الدور الوظيفي',
      roleDoctor: 'طبيب معتمد',
      roleManager: 'مدير إداري',
      roleReceptionist: 'موظف استقبال وحجوزات',
      roleNurse: 'تمريض',
      selectApprovedDocLabel: 'اختيار طبيب معتمد من الإدارة المركزية',
      selectApprovedDocOption: 'اختر الطبيب المعتمد',
      staffNameLabel: 'الاسم الكامل للموظف',
      permissionsLabel: 'الصلاحيات داخل المركز',
      addStaffBtn: 'إضافة للكادر',
      addingStaff: 'جاري الإضافة...',
      staffListTitle: 'طاقم المركز',
      noStaffYet: 'لم يتم إضافة موظفين أو أطباء لهذا المركز بعد.',
      rolePrefix: 'الدور:',
      permissionsPrefix: 'الصلاحيات:',
      activeRevokeBtn: 'نشط · إيقاف الصلاحية',
      revokedRestoreBtn: 'موقوف · إعادة تفعيل',
      appointmentsTitle: 'متابعة حجوزات المركز الطبي',
      appointmentsDescPrefix: 'سجل الحجوزات المعزول الخاص بـ',
      noAppointments: 'لا توجد حجوزات مسجلة لهذا المركز بعد.',
      colPatient: 'المريض',
      colDoctor: 'الطبيب',
      colAppointment: 'الموعد',
      colFee: 'الرسوم',
      colStatus: 'الحالة',
      colAction: 'إجراء',
      liveArrivalsAlertTitle: 'مرضى حضروا للاستقبال رقمياً',
      liveArrivalsAlertDesc: 'تم تأكيد حضورهم فورياً عبر التطبيق؛ جاهزون لتسجيل الدخول للطبيب.',
      openTodayTasksBtn: 'عرض في مهام اليوم',
      arrivedAtPrefix: 'حضر الساعة',
      analyticsTitle: 'تحليلات حجوزات العيادة الأسبوعية والشهرية',
      analyticsDesc: 'رسوم بيانية توضح عدد المواعيد المحجوزة أسبوعياً وشهرياً لمساعدة أطباء المركز في جدولة الأوقات.',
      weeklyChartTitle: 'عدد المواعيد المحجوزة أسبوعياً',
      weeklyChartDesc: 'مؤشر التدفق الأسبوعي للمواعيد في المركز.',
      monthlyChartTitle: 'عدد المواعيد المحجوزة شهرياً',
      monthlyChartDesc: 'توزيع الحجوزات عبر أشهر السنة.',
      yearLabel: 'السنة:',
      busiestWeekLabel: 'ذروة الأسبوع:',
      busiestMonthLabel: 'ذروة الشهر:',
      totalBookedWord: 'إجمالي الحجوزات',
      chartAttended: 'تم الحضور',
      chartUpcoming: 'قادمة / مؤكدة',
      chartBooked: 'إجمالي المحجوزة',
      dailySlotsChartTitle: 'عدد المواعيد المحجوزة يومياً (من الخانات الزمنية bookedSlots)',
      dailySlotsChartDesc: 'رسم بياني يوضح عدد المواعيد والفترات المحجوزة يومياً لأطباء المركز.',
      dailySlotsCountLabel: 'المواعيد المحجوزة',
      dailySlotsTotalLabel: 'إجمالي الخانات المحجوزة:',
      dailySlotsPeakLabel: 'ذروة الحجوزات اليومية:',
      noDailySlotsData: 'لا توجد خانات مواعيد محجوزة مسجلة لهذا المركز في هذه السنة.',
      permissions: {
        appointments_manage: 'إدارة المواعيد والحجوزات',
        reception: 'استقبال المرضى وتسجيل الوصول',
        services_edit: 'تحديث خدمات المركز',
        reports_view: 'عرض تقارير العيادة',
      },
      scanQrBtn: 'مسح رمز QR (استرجاع الموعد / الملف)',
    },
    admin: {
      restrictedTitle: 'وصول مقيد للإدارة المركزية فقط',
      restrictedDesc: 'هذه اللوحة مخصصة لمدير المنصة المركزي للتحقق من المستندات، اعتماد الأطباء والعيادات، ومراجعة الشكاوى وسجل التدقيق.',
      dashboardTitle: 'لوحة تحكم الإدارة المركزية',
      dashboardDesc: 'متابعة حية لإحصائيات المنصة عبر ولايات السودان، مراجعة المستندات، اعتماد الأطباء والعيادات، ومراقبة سجل التدقيق.',
      seedDataBtn: 'تهيئة بيانات الولايات المرجعية',
      seedingData: 'جاري التهيئة...',
      kpiDoctors: 'الأطباء المسجلون',
      kpiClinics: 'العيادات والمراكز',
      kpiActivePatients: 'المرضى النشطون',
      kpiTotalBookings: 'إجمالي الحجوزات',
      kpiOpenComplaints: 'شكاوى قيد المعالجة',
      approvedWord: 'معتمد',
      pendingWord: 'معلق',
      totalAccountsSuffix: 'حساب مسجل',
      acrossAllStates: 'عبر جميع الولايات',
      pendingApprovalsSuffix: 'طلب اعتماد منتظر',
      tabOverview: 'لوحة الإحصائيات الحية',
      tabApprovals: 'الاعتمادات',
      tabUsers: 'المستخدمون',
      tabComplaintsReviews: 'الشكاوى والتقييمات',
      tabAudit: 'سجل التدقيق',
      loadingData: 'جاري تحميل بيانات الإدارة المركزية الحية...',
      stateChartTitle: 'التوزيع الجغرافي للأطباء والعيادات والحجوزات حسب الولاية',
      stateChartDesc: 'تمثيل بياني حي يتحدث تلقائياً عند تسجيل أو اعتماد أي طبيب أو عيادة.',
      noStateChartData: 'لا توجد بيانات ولايات بعد — اضغط "تهيئة بيانات الولايات المرجعية" أعلاه.',
      approvalPieTitle: 'حالات اعتماد الأطباء والمراكز الطبية',
      approvalPieDesc: 'نسبة المنشآت والأطباء المعتمدين مقابل الطلبات قيد المراجعة.',
      noApprovalPieData: 'لا توجد طلبات اعتماد مسجلة حتى الآن.',
      compositionTitle: 'توازن المنظومة: المرضى والأطباء والعيادات',
      compositionDesc: 'مقارنة حية لأعداد المرضى النشطين ومقدمي الرعاية والزيارات.',
      stateTableTitle: 'ملخص التغطية الحية حسب الولاية',
      noDataAvailable: 'لا توجد بيانات متاحة للعرض.',
      colState: 'الولاية',
      colDoctors: 'الأطباء المسجلون',
      colClinics: 'العيادات والمراكز',
      colBookings: 'الحجوزات',
      doctorsQueueTitle: 'طلبات ومستندات الأطباء',
      noDoctorsRegistered: 'لا توجد ملفات أطباء مسجلة بعد.',
      clinicsQueueTitle: 'العيادات والمراكز الطبية',
      noClinicsRegistered: 'لا توجد مراكز طبية مسجلة بعد.',
      colDoctorSpecialty: 'الطبيب والتخصص',
      colLicenseQual: 'الترخيص والمؤهل',
      colStateFee: 'الولاية والرسوم',
      colStatus: 'الحالة',
      colDecision: 'قرار الإدارة',
      colCenterType: 'المركز والنوع',
      colHealthLicense: 'الترخيص الصحي',
      colStateLocality: 'الولاية والمحلية',
      approveBtn: 'اعتماد',
      rejectBtn: 'رفض',
      suspendBtn: 'تعليق',
      usersTitle: 'إدارة حسابات المستخدمين',
      colUser: 'المستخدم',
      colEmail: 'البريد الإلكتروني',
      colRole: 'الدور',
      colAction: 'إجراء',
      activeUser: 'نشط',
      suspendedUser: 'معلق',
      suspendAccountBtn: 'تعليق الحساب',
      reactivateAccountBtn: 'إعادة تفعيل',
      complaintsTitle: 'الشكاوى والبلاغات الواردة',
      noComplaints: 'لا توجد شكاوى مسجلة.',
      statusPrefix: 'الحالة:',
      resolutionPrefix: 'القرار:',
      resolveComplaintBtn: 'حل وإغلاق الشكوى',
      reviewsTitle: 'إدارة التقييمات',
      noReviews: 'لا توجد تقييمات مرسلة من المرضى بعد.',
      noComment: 'بدون تعليق',
      hideReviewBtn: 'إخفاء التقييم',
      republishReviewBtn: 'إعادة النشر',
      auditTitle: 'سجل التدقيق الأمني والعمليات الحساسة (غير قابل للتعديل)',
      noAuditLogs: 'لا توجد أحداث مسجلة في سجل التدقيق بعد.',
      colActorRole: 'المنفذ والدور',
      colOperation: 'العملية',
      colTarget: 'الهدف',
      colDetails: 'التفاصيل',
      reasonLabel: 'توضيح الأسباب / الملاحظة الإدارية',
      reasonPlaceholder: 'اكتب السبب الموثق ليظهر للمستخدم وفي سجل التدقيق...',
      confirmDecisionBtn: 'تأكيد القرار',
      chartDoctors: 'الأطباء',
      chartClinics: 'العيادات',
      chartBookings: 'الحجوزات',
      chartCount: 'العدد',
      pieApproved: 'معتمد ومنشور',
      piePending: 'قيد المراجعة',
      pieRejectedSuspended: 'مرفوض / معلق',
      compPatients: 'المرضى النشطون',
      compDoctors: 'الأطباء المسجلون',
      compClinics: 'العيادات المسجلة',
      compBookings: 'المواعيد الكلية',
    },
    tasks: {
      title: 'قائمة مهام اليوم والمواعيد القادمة',
      doctorDesc: 'بطاقات تفاعلية لمتابعة حضور المرضى وتسجيل "تم الحضور" أو "غائب" مباشرة بضغطة زر.',
      clinicDesc: 'متابعة استقبال المرضى في العيادة وتحديث حالة الحضور والغياب فور وصول المريض.',
      scopeUpcomingToday: 'القادمة ومهام اليوم',
      scopeTodayOnly: 'اليوم فقط',
      scopeAllDone: 'سجل الحالات',
      kpiToday: 'مواعيد اليوم',
      kpiUpcoming: 'مواعيد قادمة بانتظار التنفيذ',
      kpiAttended: 'تم الحضور',
      kpiNoShow: 'غائب (لم يحضر)',
      kpiArrivedWaiting: 'حضر بالعيادة (بانتظار الدخول)',
      loading: 'جاري تحميل قائمة مهام اليوم...',
      emptyTitle: 'لا توجد مهام مواعيد مطابقة لهذا النطاق حالياً',
      emptyDesc: 'عند استلام حجوزات جديدة من المرضى ستظهر هنا في شكل بطاقات تفاعلية لإدارة الحضور والغياب.',
      todayBadge: 'اليوم',
      arrivedBannerBadge: 'حضر بالعيادة الآن',
      arrivedAtPrefix: 'سجّل وصوله الساعة',
      arrivedNote: 'المريض متواجد حالياً في العيادة وبانتظار دوره لتقليل وقت الانتظار',
      visitReasonPrefix: 'سبب الزيارة:',
      generalConsult: 'استشارة طبية عامة',
      feePrefix: 'الرسوم:',
      confirmBtn: 'تأكيد',
      attendedBtn: 'تم الحضور',
      noShowBtn: 'غائب',
      completedNote: 'تم توثيق حضور المريض وإتمام الزيارة',
      noShowNote: 'تم تسجيل المريض كغائب عن الموعد',
      ehrBtn: 'ملف طبي',
      messageBtn: 'مراسلة',
    },
    chat: {
      patientTitle: 'الرسائل الآمنة مع الأطباء',
      doctorTitle: 'مركز مراسلات المرضى والاستفسارات',
      patientDesc: 'تواصل مباشرة مع طبيبك للاستفسار السريع حول المواعيد، التحضير للكشف، أو مواعيد الحضور.',
      doctorDesc: 'استقبل استفسارات المرضى حول مواعيدهم وأجب عليها مباشرة عبر قناة آمنة وموثقة.',
      secureBadge: 'مراسلة آمنة محفوظة في Firebase',
      startNewTitle: 'بدء محادثة جديدة',
      availableSuffix: 'متاح',
      selectDoctorPlaceholder: 'اختر طبيباً معتمداً...',
      selectPatientPlaceholder: 'اختر مريضاً من حجوزاتك...',
      openBtn: 'فتح',
      noThreadsYet: 'لا توجد محادثات سابقة بعد. اختر جهة اتصال من القائمة أعلاه لبدء المراسلة.',
      newThreadBadge: 'محادثة جديدة',
      youPrefix: 'أنت',
      emptyStateTitle: 'اختر محادثة أو ابدأ تواصلاً جديداً',
      emptyStateDescPatient: 'يمكنك اختيار أي طبيب معتمد من القائمة الجانبية لعرض الرسائل وإرسال الاستفسارات.',
      emptyStateDescDoctor: 'يمكنك اختيار أي مريض مرتبط بحجوزاتك من القائمة الجانبية لعرض الرسائل وإرسال الردود.',
      appointmentBadgePrefix: 'موعد:',
      noMessagesYet: 'ابدأ المحادثة بإرسال استفسارك حول الموعد أو التحضيرات المطلوبة.',
      roleDoctor: 'الطبيب',
      rolePatient: 'المريض',
      refPlaceholder: 'مرجع الموعد (اختياري، مثال: موعد الخميس 04:00 عصراً)',
      messagePlaceholder: 'اكتب رسالتك أو استفسارك هنا...',
      sendBtn: 'إرسال',
      sendingBtn: 'إرسال...',
      nowLabel: 'الآن',
    },
    reminders: {
      ariaLabel: 'تنبيهات المواعيد الطبية القادمة',
      previewTitle: 'معاينة تنبيه موعد قبل 24 ساعة',
      autoTitle: 'تذكير: موعد طبي خلال 24 ساعة',
      closeAria: 'إغلاق التنبيه',
      whatsappEnabledNote: 'مفعل للواتساب',
      detailsBtn: 'تفاصيل الموعد',
      whatsappBtn: 'تذكير واتساب',
      dismissBtn: 'تم الاستلام',
      medAutoTitle: 'تذكير بموعد تناول الدواء',
      medPreviewTitle: 'معاينة تنبيه موعد الدواء',
      medDoseTimeLabel: 'وقت الجرعة:',
      medMarkTakenBtn: 'تم تناول الجرعة',
      medOpenMedsBtn: 'الأدوية الحالية',
      medPreDose15Title: 'تنبيه: اقترب موعد الجرعة خلال 15 دقيقة',
      medDueInMinsSuffix: 'دقيقة متبقية',
      urgent30MinTitle: 'تنبيه عاجل: موعدك الطبي خلال أقل من 30 دقيقة!',
    },
    whatsapp: {
      title: 'إعدادات الحساب والوضع الليلي وإشعارات واتساب',
      subtitle: 'تخصيص مظهر التطبيق وتنبيهات المواعيد عبر التطبيق وواتساب',
      savedSuccess: 'تم حفظ رقم الهاتف وتفضيلات إشعارات واتساب بنجاح.',
      invalidPhoneError: 'يرجى إدخال رقم هاتف سوداني أو دولي صحيح لتفعيل إشعارات واتساب (مثال: 0912345678 أو +249912345678).',
      saveError: 'تعذر حفظ إعدادات الإشعارات ورقم الهاتف.',
      phoneLabel: 'رقم الهاتف المرتبط بواتساب (السودان أو دولي)',
      validPreviewPrefix: 'الصيغة الدولية الموثقة للواتساب:',
      invalidPreview: 'أدخل رقماً صحيحاً (مثل 0912345678 أو +249912345678)',
      enableWaTitle: 'تفعيل إشعارات وتذكيرات واتساب للمواعيد',
      enableWaDesc: 'تجهيز روابط إرسال وتذكيرات فورية لرقمك المرتبط قبل الموعد بـ 24 ساعة حتى عند التواجد خارج المنصة.',
      enableToastTitle: 'تفعيل إشعارات التطبيق المنبثقة (Toast Notifications)',
      enableToastDesc: 'إظهار تنبيه مرئي منبثق داخل التطبيق تلقائياً قبل موعدك بـ 24 ساعة وقبل الجرعة بـ 15 دقيقة.',
      saveBtn: 'حفظ الإعدادات',
      darkModeTitle: 'تفعيل الوضع الليلي (Dark Mode)',
      darkModeDesc: 'تغيير ألوان الواجهة بالكامل إلى درجات مريحة للعين وحفظ التفضيل في Firebase.',
      darkModeOn: 'مفعل',
      darkModeOff: 'معطل',
    },
    pdf: {
      modalTitle: 'معاينة وتصدير الملف الطبي (PDF)',
      modalSubtitle: 'ملخص شامل لزياراتك، تقاريرك التشخيصية، ومؤشراتك الحيوية لمشاركته مع أي طبيب خارج المنصة.',
      printBtn: 'طباعة',
      downloadBtn: 'تحميل ملف PDF',
      downloadJsonBtn: 'تحميل JSON',
      generatingBtn: 'جاري تجهيز ملف PDF...',
      headerEyebrow: 'المنصة الطبية السودانية الذكية · الملف الطبي الإلكتروني الموحد',
      reportTitle: 'تقرير السجل الطبي الشامل للمريض',
      reportSubtitle: 'وثيقة ملخصة قابلة للمشاركة مع الأطباء والاستشاريين خارج المنصة',
      exportDateLabel: 'تاريخ التصدير:',
      sec1Title: '1. البيانات الشخصية والصحية الأساسية',
      fullNameLabel: 'الاسم الكامل',
      dobLabel: 'تاريخ الميلاد',
      bloodTypeLabel: 'فصيلة الدم',
      heightWeightBmiLabel: 'الطول / الوزن / BMI',
      allergiesLabel: 'الحساسية الدوائية والغذائية',
      noAllergies: 'لا توجد حساسية مسجلة',
      chronicLabel: 'الأمراض المزمنة',
      noChronic: 'لا توجد أمراض مزمنة مسجلة',
      emergencyLabel: 'جهة الاتصال للطوارئ:',
      sec2Title: '2. ملخص الزيارات الطبية السابقة',
      noPastVisits: 'لا توجد زيارات طبية مكتملة مسجلة حتى تاريخ التصدير.',
      colDate: 'التاريخ',
      colDoctorSpec: 'الطبيب والتخصص',
      colClinicLoc: 'العيادة / الموقع',
      colTypeReason: 'النوع والسبب',
      sec3Title: '3. التقارير التشخيصية والوصفات العلاجية',
      noReports: 'لا توجد تقارير تشخيصية أو وصفات مسجلة بعد.',
      complaintPrefix: 'الشكوى:',
      diagnosisPrefix: 'التشخيص الطبي:',
      medsPrefix: 'الأدوية والجرعات:',
      notesPrefix: 'الملاحظات والتوصيات:',
      nutritionPrefix: 'الخطة الغذائية:',
      sec4Title: '4. الجدول الزمني للمؤشرات الصحية',
      noVitals: 'لا توجد قراءات حيوية مسجلة بعد.',
      colSource: 'المصدر',
      colBp: 'ضغط الدم',
      colWeight: 'الوزن (كجم)',
      colGlucose: 'السكر (mg/dL)',
      colHr: 'النبض (bpm)',
      footerNote: 'المنصة الطبية السودانية الذكية · مستخرج إلكترونياً بناءً على صلاحية المريض',
      cmUnit: 'سم',
      kgUnit: 'كجم',
      notRecorded: 'غير مسجل',
      notSpecified: 'غير محددة',
    },
    apps: {
      switchAppLabel: 'التبديل بين التطبيقات',
      hubEyebrow: 'منظومة التطبيقات الثلاثة الموحدة',
      hubTitle: 'اختر التطبيق المناسب لاحتياجك أو افتح رابط كل تطبيق مباشرة',
      hubDesc: 'تعمل المنصة بنظام ثلاثة تطبيقات متكاملة مع فصل كامل بين مسار تسجيل الأطباء ومسار تسجيل العيادات والمراكز الطبية.',
      activeAppBadge: 'التطبيق النشط',
      openAppBtn: 'فتح التطبيق',
      copyAppLinkBtn: 'نسخ رابط التطبيق',
      linkCopied: 'تم نسخ الرابط',
      directLinkLabel: 'الرابط المباشر للمشاركة:',
      copyDoctorLinkBtn: 'نسخ رابط تسجيل الطبيب',
      copyClinicLinkBtn: 'نسخ رابط تسجيل العيادة',
      openLinkBtn: 'فتح',
      copyBtn: 'نسخ',
      bannerAlt: 'البانر الرسمي للمنصة الطبية السودانية الذكية',
      backToMainBtn: 'العودة للمنصة الرئيسية',
      main: {
        title: 'تطبيق المنصة الرئيسية',
        shortName: 'المنصة الرئيسية',
        subtitle: 'الدليل الشامل والإدارة المركزية',
        desc: 'استعراض الدليل الطبي المعتمد في جميع ولايات السودان الـ 18، الخريطة التفاعلية، والاعتماد المركزي والإشراف.',
        openDirBtn: 'استعراض الدليل الرئيسي',
        openAdminBtn: 'الإدارة المركزية',
      },
      provider: {
        title: 'تطبيق الطبيب والعيادة',
        shortName: 'الطبيب والعيادة',
        subtitle: 'مساران منفصلان للتسجيل والإدارة',
        desc: 'تطبيق مخصص لمقدمي الرعاية الصحية يتيح فصل تسجيل الطبيب عن تسجيل العيادة أو المركز الطبي، مع إدارة المهام اليومية والرسوم البيانية.',
        registerDoctorBtn: 'تسجيل / بوابة الطبيب',
        registerClinicBtn: 'تسجيل / بوابة العيادة',
        separationTitle: 'فصل مسار التسجيل والدخول: طبيب أم عيادة / مركز طبي؟',
        separationDesc: 'اختر نوع الحساب الذي ترغب في تسجيله أو إدارته؛ يتم فصل بيانات وصلاحيات الطبيب عن بيانات وصلاحيات العيادة أو المركز الطبي بالكامل.',
        doctorTrackTitle: 'تسجيل وبوابة الطبيب',
        doctorTrackDesc: 'للأطباء المستقلين أو العاملين بالعيادات: تقديم رقم الترخيص، التخصص، رسوم الكشف، ساعات العمل، وإدارة الحجوزات والملفات الطبية.',
        doctorTrackCtaSignedOut: 'تسجيل حساب طبيب جديد / دخول',
        doctorTrackCtaSwitch: 'اعتماد مسار الطبيب لهذا الحساب',
        doctorTrackOpenBtn: 'فتح تسجيل وملف الطبيب',
        doctorTrackActiveBadge: 'مسار الطبيب نشط',
        clinicTrackTitle: 'تسجيل وبوابة العيادة / المركز',
        clinicTrackDesc: 'للعيادات والمراكز الطبية والمستشفيات: تقديم ترخيص المنشأة الصحية، الموقع الجغرافي، إضافة الكادر الطبي، وعزل بيانات كل مركز.',
        clinicTrackCtaSignedOut: 'تسجيل عيادة أو مركز جديد / دخول',
        clinicTrackCtaSwitch: 'اعتماد مسار العيادة لهذا الحساب',
        clinicTrackOpenBtn: 'فتح تسجيل وإدارة العيادة',
        clinicTrackActiveBadge: 'مسار العيادة نشط',
      },
      patient: {
        title: 'تطبيق المرضى',
        shortName: 'تطبيق المرضى',
        subtitle: 'الحجز والملف الطبي والأدوية',
        desc: 'حجز المواعيد الفورية، تسجيل الحضور الرقمي بالعيادة، متابعة الجرعة القادمة، حفظ المفضلة، وتنبيهات واتساب.',
        openPortalBtn: 'فتح بوابة المريض',
        openBookingBtn: 'حجز طبيب الآن',
      },
    },
    pwa: {
      installAppBtn: 'تثبيت التطبيق',
      installOnIosBtn: 'تثبيت على iOS',
      iosModalTitle: 'تثبيت التطبيق على iPhone / iPad',
      iosStep1: '1. اضغط على زر المشاركة (Share) في شريط سفاري السفلي.',
      iosStep2: '2. مرر للأسفل واختر إضافة إلى الشاشة الرئيسية (Add to Home Screen).',
      offlineBanner: 'وضع عدم الاتصال — يتم عرض البيانات المخزنة مؤقتاً.',
    },
    qr: {
      scannerBadge: 'قارئ QR السريع للاستقبال',
      scannerTitle: 'مسح رمز QR لاسترجاع تفاصيل الموعد أو الملف الطبي',
      scannerDesc: 'استخدم الكاميرا المباشرة، أو ارفع صورة رمز QR، أو الصق الرمز / رقم الموعد للاسترجاع الفوري.',
      startCameraBtn: 'تشغيل الكاميرا للمسح',
      stopCameraBtn: 'إيقاف الكاميرا',
      uploadImageBtn: 'رفع صورة رمز QR',
      manualPlaceholder: 'الصق محتوى رمز QR أو أدخل رقم الموعد (مثل apt_...)',
      lookupBtn: 'استرجاع البيانات',
      lookingUp: 'جاري البحث...',
      generating: 'جاري توليد رمز QR...',
      copied: 'تم النسخ',
      cameraUnavailable: 'الكاميرا غير متاحة في هذا المتصفح. يمكنك رفع صورة QR أو إدخال الرمز يدوياً.',
      cameraPermissionDenied: 'تم رفض إذن الكاميرا أو تعذر الوصول إليها. استخدم رفع الصورة أو الإدخال اليدوي.',
      decodeImageFailed: 'تعذر قراءة رمز QR من الصورة المحددة. تأكد من وضوح الرمز.',
      invalidPayload: 'الرمز المدخل غير صالح ولا يطابق تنسيق المواعيد أو الملف الطبي.',
      notFoundError: 'لم يتم العثور على الموعد أو ليس لديك صلاحية لعرضه.',
      retrievedAppointmentTitle: 'تفاصيل الموعد المسترجع',
      retrievedEhrTitle: 'ملخص الملف الطبي الطارئ للمريض',
      patientLabel: 'المريض',
      doctorLabel: 'الطبيب',
      clinicLabel: 'العيادة / المركز',
      dateTimeLabel: 'التاريخ والفترة',
      feeLabel: 'رسوم الكشف',
      reasonLabel: 'سبب الزيارة',
      markArrivedBtn: 'تسجيل الوصول بالعيادة',
      statusUpdatedMsg: 'تم تحديث حالة الموعد بنجاح.',
    },
  },
  en: {
    common: {
      platformName: 'Sudanese Smart Medical Platform',
      platformTagline: 'Unified Digital Healthcare Across All 18 Sudanese States',
      loading: 'Loading...',
      initializing: 'Initializing platform...',
      close: 'Close',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving...',
      submit: 'Submit',
      submitting: 'Submitting...',
      all: 'All',
      newLabel: 'New',
      privateClinic: 'Private Clinic',
      notSpecified: 'Not specified',
      yearsSuffix: 'yrs',
      reviewsCountSuffix: 'reviews',
      starsSuffix: 'stars',
      signIn: 'Sign In',
      signInWithGoogle: 'Sign in with Google',
      signingIn: 'Signing in...',
      signOut: 'Sign Out',
      suspendedTitle: 'This account has been temporarily suspended by Central Administration',
      suspendedReasonPrefix: 'Suspension reason: ',
      suspendedDefaultMsg: 'Please contact Central Administration to review your account status.',
      authInitError: 'Could not initialize account profile.',
      authSignInError: 'Sign-in failed. Please try again.',
    },
    quota: {
      bannerText: 'Google Maps demo quota exceeded or key verification failed temporarily. Clinic locations are shown using local geographic coordinates.',
      learnMore: 'Quota & API Key Docs',
    },
    nav: {
      directory: 'Medical Directory',
      patient: 'Patient Portal',
      doctor: 'Doctor Portal',
      clinic: 'Clinics & Centers',
      admin: 'Central Admin',
      whatsappActive: 'WhatsApp On',
      linkWhatsapp: 'Link WhatsApp',
      whatsappActiveLong: 'WhatsApp Notifications Enabled',
      linkWhatsappLong: 'Link Phone & Enable WhatsApp',
      whatsappSettingsTitle: 'Phone & WhatsApp Notification Settings',
      navMenuAria: 'Navigation menu',
      signOutShort: 'Sign out',
      switchLangLabel: 'العربية',
      switchLangAria: 'التبديل إلى اللغة العربية',
      darkModeToggleTitle: 'Toggle Dark Mode',
      darkModeOn: 'Dark Mode On',
      darkModeOff: 'Light Mode On',
    },
    footer: {
      copyright: '© 2026 Sudanese Smart Medical Platform · All 18 States of Sudan',
    },
    directory: {
      heroEyebrow: 'Verified Healthcare Network Across All Sudanese States',
      heroTitle: 'Trusted Access to Approved Doctors & Unified Medical Records',
      heroDesc: 'A unified digital medical platform connecting patients with centrally accredited doctors, clinics, and medical centers across all 18 states of Sudan, with appointment booking and private electronic health records.',
      heroFindDoctorBtn: 'Find an Approved Doctor',
      heroJoinBtn: 'Join as Doctor or Clinic',
      heroImgAlt: 'Modern medical center in the Sudanese Smart Medical Platform',
      statStatesSuffix: 'States',
      statStatesDesc: 'Coverage by state, locality, and neighborhood',
      statDoctorsSuffix: 'Approved Doctors',
      statDoctorsDesc: 'Credentials & licenses verified before listing',
      statClinicsSuffix: 'Centers & Clinics',
      statClinicsDesc: 'Strict multi-clinic data & permission isolation',
      statEhrTitle: 'Unified EHR',
      statEhrDesc: 'Visits, prescriptions, vitals, and nutrition plans',
      sectionTitle: 'Approved Medical Directory in Sudan',
      sectionDesc: 'Only doctors and clinics whose medical licenses have been verified by Central Administration appear here.',
      tabDoctors: 'Approved Doctors',
      tabClinics: 'Clinics & Centers',
      allSpecialties: 'All Specialties',
      liveSearchLabel: 'Live Search (Name, Service, Credential)',
      liveSearchPlaceholder: 'Search by doctor, clinic, service...',
      specialtyLabel: 'Medical Specialty',
      stateLabel: 'State',
      allStatesOption: 'All 18 Sudanese States',
      localityLabel: 'Locality',
      allLocalitiesOption: 'All Localities',
      hideAdvancedFilters: 'Hide Advanced Filters',
      showAdvancedFilters: 'Show Advanced Filters',
      liveResultsPrefix: 'Live results:',
      liveResultsOf: 'of',
      clearFilters: 'Clear All Filters',
      areaLabel: 'Neighborhood / Area',
      areaPlaceholder: 'Al-Amarat, Al-Muhandisin, Riyadh...',
      maxFeeLabel: 'Max Consultation Fee',
      anyFee: 'Any fee',
      upToFee: 'Up to',
      genderFilterLabel: 'Doctor Gender',
      maleDoctor: 'Male Doctor',
      femaleDoctor: 'Female Doctor',
      workingDayLabel: 'Available Working Day',
      allDays: 'All Days',
      sortByLabel: 'Sort Results',
      sortHighestRated: 'Highest Rated',
      sortLowestFee: 'Lowest Fee',
      sortMostExperienced: 'Most Experienced',
      noDoctorsTitle: 'No approved doctors match your current filters',
      noDoctorsDesc: 'Try expanding the state or specialty filters, or seed reference data from the Central Admin portal.',
      showAllStatesBtn: 'Show All States & Specialties',
      noClinicsTitle: 'No approved clinics or centers match your search',
      noClinicsDesc: 'Try changing the state, locality, or clearing the search query.',
      experiencePrefix: 'Exp.',
      consultationFee: 'Consultation Fee',
      viewAndBookBtn: 'View Profile & Book',
      licenseLabel: 'License',
      servicesPrefix: 'Services:',
      centerDetailsAndDoctors: 'Center Details & Doctors',
      qualificationsAndLicense: 'Qualifications & License',
      workplaceAndState: 'Workplace & State',
      daysAndHours: 'Working Days & Hours',
      centralApprovalLabel: 'Central Approval',
      approvedVerified: 'Approved & Verified',
      providedServices: 'Provided Services:',
      reviewsAndAvgTitle: 'Patient Ratings & Reviews',
      noRecentTextReviews: 'No written reviews published recently — overall verified rating:',
      overallApprovedRating: 'Verified Rating',
      bookAppointmentTitle: 'Book Medical Appointment',
      signInToBookPrompt: 'Please sign in with your patient account to complete booking and access your EHR.',
      signInNowBtn: 'Sign In Now',
      appointmentDateLabel: 'Appointment Date',
      timeSlotLabel: 'Time Slot',
      visitTypeLabel: 'Visit Type',
      visitReasonLabel: 'Reason for Visit / Initial Symptoms (Optional)',
      visitReasonPlaceholder: 'Briefly describe your reason for visiting...',
      bookingSuccessMsg: 'Appointment request submitted successfully. Track confirmation in the Patient Portal.',
      bookingErrorMsg: 'Failed to submit booking. Please try again.',
      viewMyBookings: 'View My Appointments',
      confirmBookingBtn: 'Confirm Booking Request',
      sendingBooking: 'Submitting booking...',
      geoLocationLabel: 'Geographic Location',
      hoursAndPhoneLabel: 'Working Hours & Phone',
      availableMedicalServices: 'Available Medical Services',
      clinicPatientReviews: 'Patient Reviews for Center',
      averagePrefix: 'Average:',
      noRecentClinicReviews: 'No recent written reviews for this center yet.',
      linkedApprovedDoctors: 'Approved Doctors Linked to Center',
      noLinkedDoctors: 'No doctors are directly linked to this center ID yet.',
      bookAppointmentBtn: 'Book Appointment',
      voiceSearchStartAria: 'Voice search for a doctor or specialty',
      voiceSearchStopAria: 'Stop voice search',
      voiceSearchListening: 'Listening... Speak a doctor name or medical specialty',
      voiceSearchUnsupported: 'Voice search (Web Speech API) is not supported in this browser. Try Chrome or Edge.',
      voiceSearchDenied: 'Microphone permission was denied. Please enable microphone access in browser settings.',
      voiceSearchNoSpeech: 'No clear speech was detected. Please try again.',
      voiceSearchError: 'Voice search could not complete right now. Please try again.',
      clearSearchAria: 'Clear search text',
      availableNowBtn: 'Available Now (Next 24h)',
      availableNowCountSuffix: 'doctors available now',
      urgentOpenSlotPrefix: 'Open slot in 24h:',
      bookedSlotDisabled: 'Booked',
      favoriteAdd: 'Add to Favorites',
      favoriteRemove: 'Remove from Favorites',
      favoriteSignInPrompt: 'Please sign in to save doctors and clinics to your favorites list.',
      geoFilterTitle: 'Filter by Geographic Region & State',
      regionLabel: 'Geographic Region',
      allRegionsOption: 'All Sudan Regions',
      allRegionStatesOption: 'All States in Region',
      doctorsShortSuffix: 'doctors',
      clinicsShortSuffix: 'centers',
      statusAvailableBadge: 'Available',
      statusBusyBadge: 'Busy',
    },
    map: {
      sectionTitle: 'Interactive Map of Approved Clinics & Medical Centers',
      sectionDesc: 'Explore verified medical centers across Sudan states. Click any map pin to inspect clinic details or get directions.',
      toggleShow: 'Show Map',
      toggleHide: 'Hide Map',
      resetView: 'All Sudan View',
      approvedCentersCount: 'approved centers on map',
      allSudanStates: 'All Sudan States',
      stateFilterActive: 'Selected state:',
      regionFilterActive: 'Selected region:',
      centerListTitle: 'Visible Approved Centers',
      noClinicsOnMap: 'No approved clinics or centers match the current filters to display on the map.',
      doctorsCountSuffix: 'approved doctors',
      clickPinHint: 'Click a map pin or choose a center from the list',
      viewCenterDetails: 'Center Details & Doctors',
      getDirections: 'Get Directions',
      missingKeyTitle: 'Google Maps API Key Not Configured',
      missingKeyDesc: 'You can still browse verified center locations and open directions directly below.',
      loadErrorTitle: 'Interactive Google Map Temporarily Unavailable',
      loadErrorDesc: 'Check network or key settings. Direct Google Maps navigation links remain available for every center.',
      approxLocationNote: 'State / locality center coordinates',
      verifiedPlaceNote: 'Verified via Google Maps Places',
    },
    patient: {
      portalLabel: 'Patient Portal',
      gateTitle: 'Patient Portal & Electronic Health Record',
      gateDesc: 'Sign in to manage your appointments, view clinical diagnoses and prescriptions, and control which doctors may access your medical file.',
      tabAppointments: 'My Appointments',
      tabReminders: 'Alerts & Settings',
      tabFavorites: 'Favorites',
      tabEhr: 'Electronic Health Record',
      tabMessages: 'Doctor Messages',
      tabConsent: 'Access & Privacy',
      tabComplaints: 'Complaints & Reports',
      remindersTitle: 'Automated 24-Hour & WhatsApp Reminders',
      remindersDesc: 'Link your phone number to enable WhatsApp alerts alongside in-app toast notifications 24 hours before appointments.',
      toastOnBtn: 'App Toasts On · Disable',
      toastOffBtn: 'App Toasts Off · Enable',
      waCardTitle: 'Phone Linking & WhatsApp Alerts (Off-Platform)',
      waCardDesc: 'Receive appointment reminder links via WhatsApp so you never miss a medical visit.',
      waLinkedBadge: 'WhatsApp Active',
      waNotLinkedBadge: 'Not Linked Yet',
      waPhoneLabel: 'WhatsApp Phone Number',
      waPhoneValidPrefix: 'Formatted WhatsApp number:',
      waPhoneInvalid: 'Enter a valid Sudan or international number (e.g. 0912345678 or +249912345678)',
      waCheckboxTitle: 'Enable Automatic WhatsApp Reminders',
      waCheckboxDesc: 'Attach direct WhatsApp dispatch buttons to all upcoming appointment reminders.',
      toastCheckboxTitle: 'Enable In-App Toast Notifications',
      toastCheckboxDesc: 'Display visual reminder popups inside the app 24 hours before visits.',
      savePhoneAndPrefs: 'Save Phone & Notification Settings',
      upcoming24hHeader: 'Appointments within 24-hour reminder window:',
      noUpcoming24h: 'No appointments within the next 24 hours right now.',
      previewNearestToast: 'Preview Toast for Nearest Appointment',
      sendViaWhatsapp: 'Send via WhatsApp',
      showAppToast: 'Show App Toast',
      copyReminderText: 'Copy Reminder Text',
      copied: 'Copied',
      appointmentsTitle: 'Appointments & Monthly Health Activity',
      appointmentsDesc: 'Monitor your monthly medical visits across the year, manage bookings, and rate doctors and clinics after visits.',
      bookNewAppointment: 'Book New Appointment',
      upcoming24hAlertTitle: 'Upcoming appointments within 24 hours:',
      nearestAppointmentLabel: 'Nearest:',
      showVisualAlert: 'Show Visual Alert',
      loyaltyHeader: 'Healthcare Loyalty Program · Level',
      loyaltyUnit: 'Health Points',
      progressTowards: 'Progress towards',
      maxTierReached: 'You have reached the highest health membership tier',
      visitsPointsSummary: 'completed visits',
      reviewsPointsSummary: 'reviews submitted',
      pointsRemainingPrefix: '',
      pointsRemainingSuffix: 'points to next tier',
      annualActivityTitle: 'Monthly Health Activity: Medical Visits in',
      annualActivityDesc: 'Monthly comparison of completed visits and scheduled appointments across 12 months.',
      yearLabel: 'Year:',
      totalYearVisits: 'Total Visits',
      completedVisits: 'Completed Visits',
      scheduledVisits: 'Scheduled / Upcoming',
      peakMonth: 'Most Active Month',
      chartCompleted: 'Completed Visits',
      chartScheduled: 'Scheduled Appointments',
      noYearVisits: 'No medical visits recorded for this year yet — bars update automatically as you book or attend.',
      pendingReviewsTitle: 'Completed Appointments Awaiting Your Rating',
      rateDoctorAndClinic: 'Rate Doctor & Clinic',
      noAppointmentsTitle: 'No Appointments Booked Yet',
      noAppointmentsDesc: 'Browse approved doctors in your state to book your first medical consultation.',
      browseDirectory: 'Browse Medical Directory',
      colDoctorSpecialty: 'Doctor & Specialty',
      colCenterState: 'Center & State',
      colDateTime: 'Date & Time',
      colTypeFee: 'Type & Fee',
      colStatus: 'Status',
      colActions: 'Actions',
      messageDoctorBtn: 'Message Doctor',
      reviewedLabel: 'Reviewed',
      myReviewsTitle: 'My Published Doctor & Clinic Reviews',
      clinicRatingLabel: 'Clinic Rating',
      ehrTitle: 'Unified Electronic Health Record (EHR)',
      ehrDesc: 'Past visit history, doctor diagnostic reports, current medications, blood pressure & weight timelines, and baseline medical data.',
      exportPdfBtn: 'Export Medical Record (PDF)',
      exportJsonBtn: 'Download JSON',
      downloadAppointmentsPdfBtn: 'Download PDF',
      downloadAppointmentsJsonBtn: 'Download Appointments (JSON)',
      jsonExportSuccess: 'Downloaded local JSON file to your device.',
      printEhrBtn: 'Print',
      printReportHeader: 'Sudanese Smart Medical Platform · Patient Medical Record Printout',
      printGeneratedLabel: 'Printed on:',
      ehrFilterAll: 'Full View',
      ehrFilterVisits: 'Visit History',
      ehrFilterReports: 'Diagnostic Reports',
      ehrFilterMedications: 'Current Medications',
      ehrFilterVitals: 'Vitals Timeline',
      ehrFilterProfile: 'Baseline & Self-Log',
      pastVisitsTitle: 'Past Medical Visits History',
      pastVisitsDesc: 'Chronological record of your completed visits and verified clinical consultations.',
      visitsUnit: 'visits',
      noPastVisits: 'No completed medical visits recorded yet.',
      colVisitDate: 'Visit Date',
      colClinicLocation: 'Clinic & Location',
      colTypeReason: 'Type & Reason',
      colReport: 'Diagnostic Report',
      viewReportBtn: 'View Report',
      completedWord: 'Completed',
      diagnosticReportsTitle: 'Doctor Diagnostic Reports & Prescriptions',
      diagnosticReportsDesc: 'Medical diagnoses, consultation outcomes, prescribed medications, and nutrition plans.',
      noDiagnosticReports: 'No diagnostic reports recorded by doctors yet.',
      chiefComplaintLabel: 'Chief Complaint:',
      diagnosisLabel: 'Clinical Diagnosis:',
      medicationsLabel: 'Medications & Dosage:',
      vitalsTitle: 'Health Vitals Timeline (Blood Pressure & Weight)',
      vitalsDesc: 'Historical tracking of blood pressure, weight, blood glucose, and heart rate.',
      readingsCountSuffix: 'readings',
      noVitalsYet: 'No vital readings recorded yet to display the timeline.',
      addFirstVitalsBtn: 'Log First Blood Pressure & Weight',
      bpChartTitle: 'Blood Pressure Trend (mmHg)',
      weightChartTitle: 'Weight Trend (kg)',
      bpSystolic: 'Systolic',
      bpDiastolic: 'Diastolic',
      weightLabel: 'Weight (kg)',
      colDate: 'Date',
      colSourceDesc: 'Source / Description',
      colBp: 'Blood Pressure',
      colBpStatus: 'BP Status',
      colWeight: 'Weight (kg)',
      colDelta: 'Change',
      colGlucose: 'Glucose (mg/dL)',
      colHeartRate: 'Heart Rate (bpm)',
      baselineTitle: 'Baseline Medical Data',
      bmiLabel: 'Body Mass Index (BMI):',
      fullNameLabel: 'Full Name',
      dobLabel: 'Date of Birth',
      bloodTypeLabel: 'Blood Type',
      genderLabel: 'Gender',
      male: 'Male',
      female: 'Female',
      heightLabel: 'Height (cm)',
      weightInputLabel: 'Weight (kg)',
      allergiesLabel: 'Drug & Food Allergies (comma-separated)',
      chronicLabel: 'Chronic Conditions (comma-separated)',
      emergencyLabel: 'Emergency Contact',
      saveBaselineBtn: 'Save Baseline Profile',
      selfMeasTitle: 'Log Daily Health Measurements (Appears Immediately in Timeline)',
      measDescLabel: 'Measurement Note',
      measSystolicLabel: 'Systolic BP',
      measDiastolicLabel: 'Diastolic BP',
      measGlucoseLabel: 'Glucose (mg/dL)',
      measHrLabel: 'Heart Rate (bpm)',
      measWeightLabel: 'Weight (kg)',
      addMeasBtn: 'Add Reading to EHR',
      consentTitle: 'Medical Record Access Permissions',
      consentDesc: 'Your medical file and clinical records are only shared with doctors you explicitly authorize below.',
      noConsentDoctors: 'No approved doctors are currently available.',
      consentAuthorized: 'Authorized · Click to Revoke',
      consentGrant: 'Grant Access',
      complaintsTitle: 'Complaints & Administrative Reports',
      complaintsDesc: 'Central Administration reviews all complaints to uphold clinical quality and ethics.',
      complaintTargetLabel: 'Target Category',
      complaintTargetDoctor: 'Doctor',
      complaintTargetClinic: 'Clinic or Medical Center',
      complaintTargetPlatform: 'Platform Technical / Admin Note',
      complaintTargetNameLabel: 'Doctor or Center Name',
      complaintSubjectLabel: 'Subject',
      complaintDetailsLabel: 'Details',
      submitComplaintBtn: 'Submit Complaint to Central Admin',
      adminReplyLabel: 'Admin Resolution:',
      reviewModalTitle: 'Rate Doctor & Clinic After Visit',
      reviewModalDatePrefix: 'Appointment on',
      rateDoctorTitle: 'Doctor Rating:',
      doctorCommentLabel: 'Feedback on the doctor and consultation',
      doctorCommentPlaceholder: 'Share your experience regarding clinical care...',
      rateClinicTitle: 'Clinic / Center Rating:',
      clinicCommentLabel: 'Feedback on the clinic or center (optional)',
      clinicCommentPlaceholder: 'Share notes on reception, organization, and cleanliness...',
      publishReviewBtn: 'Publish Review',
      publishingReview: 'Publishing...',
      tiers: ['New Health Member', 'Active Member', 'Consistent Member', 'Distinguished Member', 'Health Care Ambassador'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      ratingLabels: { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' },
      bpNormal: 'Normal',
      bpHigh: 'High',
      bpElevated: 'Elevated',
      bpLow: 'Low',
      medicationsSectionTitle: 'Current Medications & Dose Reminders',
      medicationsSectionDesc: 'Track active prescriptions, update usage status, and schedule daily dose times to receive timely reminders.',
      medicationsAddToggleBtn: 'Add Medication',
      medicationsEmpty: 'No medications added yet. Add a medication manually or import one from your diagnostic reports.',
      medicationsNameLabel: 'Medication Name',
      medicationsNamePlaceholder: 'e.g. Amoxicillin 500mg or Metformin',
      medicationsDosageLabel: 'Dosage',
      medicationsDosagePlaceholder: 'e.g. 1 tablet (500 mg)',
      medicationsFrequencyLabel: 'Frequency',
      medicationsFrequencyPlaceholder: 'e.g. Every 12 hours / Twice daily',
      medicationsTimesLabel: 'Daily Dose Times (24h format, e.g. 08:00, 20:00)',
      medicationsTimesHint: 'Tap quick time presets or enter comma-separated times.',
      medicationsStatusLabel: 'Usage Status',
      medicationsNotesLabel: 'Instructions / Notes',
      medicationsNotesPlaceholder: 'Take after breakfast and dinner...',
      medicationsReminderCheck: 'Enable dose-time reminder notifications (Toast)',
      medicationsSaveBtn: 'Save Medication',
      medicationsStatusActive: 'Active / Taking',
      medicationsStatusPaused: 'Paused Temporarily',
      medicationsStatusStopped: 'Stopped',
      medicationsPrescribedByLabel: 'Prescribed by:',
      medicationsDueNowBadge: 'Dose Due Now',
      medicationsTakenTodayBadge: "Today's Dose Taken",
      medicationsNoSchedule: 'No scheduled times set',
      medicationsNextDosePrefix: 'Next dose:',
      medicationsMarkTakenBtn: 'Mark Dose Taken',
      medicationsPreviewAlertBtn: 'Preview Alert',
      medicationsReminderOn: 'Reminder On',
      medicationsReminderOff: 'Reminder Off',
      medicationsDeleteBtn: 'Remove',
      medicationsFromReportsTitle: 'Medications Prescribed in Your Reports (1-Click Track)',
      medicationsFromReportsDesc: 'Import prescribed items to monitor status and receive dose alerts.',
      medicationsImportBtn: 'Add to Current Medications',
      medicationsImportedMsg: 'Medication added from doctor prescription to Current Medications.',
      medicationsActiveAlertBanner: 'Medication Dose Alert: You have active medications due right now.',
      checkInBtn: 'Confirm Arrival at Clinic',
      checkingInBtn: 'Checking in...',
      checkedInBadge: 'Checked In at Clinic',
      checkedInAtPrefix: 'Checked in at:',
      checkInSuccessMsg: 'Your arrival has been confirmed digitally and the doctor & reception desk were notified immediately.',
      todayCheckInCardTitle: "Today's Appointment — Digital Reception Check-In",
      todayCheckInCardDesc: 'Once you arrive at the clinic, tap Confirm Arrival to notify the doctor and reception immediately and reduce waiting time.',
      waitingDoctorNotice: 'You are now in the doctor’s live waiting queue',
      favoritesTitle: 'Saved Favorites: Doctors & Clinics',
      favoritesDesc: 'Quickly access and book appointments with your favorite approved doctors and medical centers.',
      favoriteDoctorsTitle: 'Favorite Doctors',
      favoriteClinicsTitle: 'Favorite Clinics & Centers',
      noFavoritesTitle: 'Your Favorites List Is Empty',
      noFavoritesDesc: 'Tap the heart icon on any doctor or clinic card in the Medical Directory to save them here.',
      removeFavoriteBtn: 'Remove',
      nextDoseCardTitle: 'Next Scheduled Medication Dose',
      nextDosePre15Badge: 'Due within 15 minutes',
      nextDoseNone: 'No scheduled doses for active medications right now.',
      nextDoseTakenTodayCount: 'Active medications tracked:',
      darkModeSectionTitle: 'App Appearance — Dark Mode',
      darkModeSectionDesc: 'Switch the entire platform interface to comfortable dark colors and save your preference in Firebase.',
      darkModeOnLabel: 'Dark Mode Enabled (Eye-Comfort)',
      darkModeOffLabel: 'Standard Light Mode Active',
      push30MinTitle: '30-Minute Push / Web Appointment Alerts',
      push30MinDesc: 'Receive a native browser notification automatically 30 minutes before your scheduled appointment.',
      pushEnableBtn: 'Enable Push Alerts',
      pushEnabledBadge: '30-Min Push Alerts Active',
      pushBlockedBadge: 'Blocked in Browser Settings',
      pushUnsupportedBadge: 'Web Notifications Unsupported',
      pushTestBtn: 'Test 30-Min Alert',
      pushTestSentMsg: 'Test 30-minute appointment alert dispatched.',
      pushToggleLabel: 'Auto-notify 30 min before appointments',
      appointmentQrBtn: 'QR Code',
      ehrQrBtn: 'Medical Record QR',
      qrAppointmentTitle: 'Appointment Check-In QR Code',
      qrAppointmentBadge: 'Digital Visit Pass',
      qrEhrTitle: 'Patient Emergency Medical Record QR',
      qrEhrBadge: 'Portable EHR Summary',
      qrScanHint: 'Present this QR code to clinic reception or your doctor for instant details retrieval.',
      qrDownloadPngBtn: 'Download PNG',
      qrCopyPayloadBtn: 'Copy Code Data',
    },
    doctor: {
      portalLabel: 'Doctor Portal',
      gateTitle: 'Sudanese Doctor Portal',
      gateDesc: 'Create your professional profile, set specialty, qualifications, workplace, and consultation fees. Publishing and bookings unlock after Central Admin approval.',
      signInBtn: 'Sign In to Doctor Portal',
      tabProfile: 'Profile & Accreditation',
      tabTodayTasks: "Today's Tasks",
      tabBookings: 'Bookings & Analytics',
      tabEhrAuthor: 'EHR & Nutrition Plans',
      tabMessages: 'Patient Messages',
      approvalStatusPrefix: 'Central Approval Status:',
      approvedNotice: 'Your profile is currently published in directory search and open for bookings.',
      pendingNotice: 'Your application is under review by Central Administration. Your profile remains hidden until approved.',
      rejectedPrefix: 'Admin note:',
      editProfileTitle: 'Update Doctor Professional Profile',
      newProfileTitle: 'Submit New Doctor Accreditation Request',
      profileDesc: 'Enter your professional details, Sudan Medical Council registration number, and geographic location.',
      fullNameLabel: 'Full Professional Name',
      genderLabel: 'Title / Gender',
      male: 'Male Doctor',
      female: 'Female Doctor',
      specialtyLabel: 'Medical Specialty',
      licenseLabel: 'Medical License / SMC Number',
      expYearsLabel: 'Years of Experience',
      feeSdgLabel: 'Consultation Fee (SDG)',
      qualificationsLabel: 'Academic Qualifications & Boards',
      stateLabel: 'State',
      localityLabel: 'Locality',
      areaLabel: 'Neighborhood / Area',
      workplaceLabel: 'Workplace / Clinic Name',
      linkClinicLabel: 'Link to Approved Medical Center (Optional)',
      independentClinicOption: 'Independent Clinic / Unlinked',
      servicesLabel: 'Services Provided (comma-separated)',
      workingHoursLabel: 'Working Hours',
      workingDaysLabel: 'Weekly Working Days',
      bioLabel: 'Short Professional Bio',
      saveProfileBtn: 'Save Professional Updates',
      submitProfileBtn: 'Submit Accreditation Request',
      bookingsAnalyticsTitle: 'Bookings Management & Clinic Analytics',
      bookingsAnalyticsDesc: 'Weekly appointment distribution, occupancy rate per clinic, and patient attendance controls.',
      weekdayChartTitle: 'Appointments Distribution by Weekday',
      weekdayChartDesc: 'Compare attended, upcoming, and no-show appointments across days of the week.',
      occupancyChartTitle: 'Occupancy Rate per Clinic',
      occupancyChartDesc: 'Calculated from active & completed bookings against daily slot capacity.',
      noOccupancyData: 'No clinics or bookings recorded yet to compute occupancy.',
      occupancyRateLabel: 'Occupancy Rate',
      slotsWord: 'slots',
      noBookings: 'No incoming appointments yet.',
      colPatient: 'Patient',
      colDateTime: 'Date & Time',
      colReasonNote: 'Reason / Note',
      colFee: 'Fee',
      colStatus: 'Status',
      colAction: 'Action',
      confirmBtn: 'Confirm',
      attendedBtn: 'Attended',
      noShowBtn: 'No Show',
      cancelBtn: 'Cancel',
      addEhrBtn: 'Add EHR',
      messagePatientBtn: 'Message Patient',
      ehrAuthorTitle: 'Medical Records & Nutrition Plan Authoring',
      ehrAuthorDesc: 'View shared patient data and author clinical consultations, diagnoses, prescriptions, vitals, and nutrition plans.',
      authorizedPatientsTitle: 'Patients Who Granted You Access to Baseline Data',
      newEhrFormTitle: 'Author New Consultation / Diagnosis / Prescription / Nutrition Plan',
      noAuthorizedPatients: 'No patients linked via bookings or consent yet.',
      selectPatientOption: 'Select Patient',
      recordTypeLabel: 'Record Type',
      recordTitleLabel: 'Record Title',
      chiefComplaintLabel: 'Chief Complaint',
      diagnosisLabel: 'Clinical Diagnosis',
      medicationsLabel: 'Medications & Dosages (comma-separated)',
      systolicLabel: 'Systolic BP',
      diastolicLabel: 'Diastolic BP',
      glucoseLabel: 'Blood Glucose (mg/dL)',
      nutritionSectionTitle: 'Nutrition & Exercise Plan (If Needed)',
      caloriesLabel: 'Daily Target Calories',
      nutritionGoalLabel: 'Therapeutic Goal',
      mealGuidelinesLabel: 'Meal Guidelines',
      activityPlanLabel: 'Physical Activity Plan',
      doctorNotesLabel: 'Doctor Notes & Recommendations',
      saveEhrBtn: 'Save Record to Patient EHR',
      recentEhrTitle: 'Accessible Clinical Records',
      patientPrefix: 'Patient:',
      authoredByPrefix: 'Recorded by:',
      chartAttended: 'Attended',
      chartUpcoming: 'Upcoming / Confirmed',
      chartNoShow: 'No Show',
      liveArrivalsAlertTitle: 'Patients Arrived at Clinic & Waiting',
      liveArrivalsAlertDesc: 'Digitally checked in — synced in real time to minimize reception wait.',
      openTodayTasksBtn: "Open Today's Tasks",
      arrivedAtPrefix: 'Arrived at',
      weeklyChartTitle: 'Weekly Booked Appointments',
      weeklyChartDesc: 'Track weekly booking volume (Saturday week start) to optimize schedule capacity.',
      monthlyChartTitle: 'Monthly Booked Appointments',
      monthlyChartDesc: 'Monthly breakdown of booked appointments across the selected year.',
      yearLabel: 'Year:',
      busiestWeekLabel: 'Busiest Week:',
      busiestMonthLabel: 'Busiest Month:',
      totalBookedWord: 'Total Booked',
      chartBooked: 'Total Booked',
      dailySlotsChartTitle: 'Appointments Per Day (from Booked Slots)',
      dailySlotsChartDesc: 'Daily volume of booked time slots to help visualize daily clinic demand.',
      dailySlotsCountLabel: 'Booked Slots',
      dailySlotsTotalLabel: 'Total Booked Slots:',
      dailySlotsPeakLabel: 'Peak Day:',
      noDailySlotsData: 'No booked slots recorded for this year yet.',
      availabilityTitle: 'Real-Time Directory Availability Status',
      availabilityDesc: 'Your Available/Busy status syncs live to the Medical Directory so patients see your current availability.',
      statusAvailable: 'Available',
      statusBusy: 'Busy',
      toggleToBusyBtn: 'Switch to Busy',
      toggleToAvailableBtn: 'Switch to Available',
      scanQrBtn: 'Scan Patient / Appointment QR',
    },
    clinic: {
      gateTitle: 'Clinics & Medical Centers Portal',
      gateDesc: 'Register your clinic or medical center in any Sudanese state, onboard centrally approved doctors and staff with isolated permissions, and track bookings.',
      signInBtn: 'Sign In to Manage Center',
      activeCenterLabel: 'Active Medical Center',
      registerNewClinicBtn: '+ Register New Clinic / Center',
      tabCenter: 'Center Profile & Services',
      tabTodayTasks: "Today's Tasks",
      tabStaff: 'Doctors & Staff',
      tabAppointments: 'Center Bookings',
      isolationNotice: 'This center’s records and staff are strictly isolated from all other clinics by clinic ID.',
      newCenterTitle: 'Register New Clinic or Medical Center',
      editCenterTitle: 'Update Medical Center Profile',
      centerFormDesc: 'Centers undergo license verification by Central Administration before appearing in directory search.',
      centerNameLabel: 'Clinic or Medical Center Name',
      centerTypeLabel: 'Facility Type',
      licenseLabel: 'Health Facility License Number',
      phoneLabel: 'Reception Phone',
      workingHoursLabel: 'Working Hours',
      stateLabel: 'State',
      localityLabel: 'Locality',
      areaLabel: 'Neighborhood / Area',
      addressLabel: 'Street Address',
      servicesLabel: 'Available Services & Specialties (comma-separated)',
      submitCenterBtn: 'Submit Center Application',
      saveCenterBtn: 'Save Center Changes',
      registerClinicFirst: 'Please register a clinic or medical center first to manage doctors and staff.',
      addStaffTitle: 'Add Approved Doctor or Staff to',
      staffRoleLabel: 'Staff Role',
      roleDoctor: 'Approved Doctor',
      roleManager: 'Administrative Manager',
      roleReceptionist: 'Receptionist & Booking Desk',
      roleNurse: 'Nursing Staff',
      selectApprovedDocLabel: 'Select Centrally Approved Doctor',
      selectApprovedDocOption: 'Choose Approved Doctor',
      staffNameLabel: 'Staff Full Name',
      permissionsLabel: 'Center Permissions',
      addStaffBtn: 'Add to Staff',
      addingStaff: 'Adding...',
      staffListTitle: 'Center Staff Roster',
      noStaffYet: 'No doctors or staff members added to this center yet.',
      rolePrefix: 'Role:',
      permissionsPrefix: 'Permissions:',
      activeRevokeBtn: 'Active · Revoke Access',
      revokedRestoreBtn: 'Revoked · Restore Access',
      appointmentsTitle: 'Center Bookings Tracker',
      appointmentsDescPrefix: 'Isolated appointment log for',
      noAppointments: 'No bookings recorded for this center yet.',
      colPatient: 'Patient',
      colDoctor: 'Doctor',
      colAppointment: 'Appointment',
      colFee: 'Fee',
      colStatus: 'Status',
      colAction: 'Action',
      liveArrivalsAlertTitle: 'Patients Digitally Checked In at Reception',
      liveArrivalsAlertDesc: 'Confirmed arrival via the app in real time; ready for consultation.',
      openTodayTasksBtn: "View Today's Tasks",
      arrivedAtPrefix: 'Arrived at',
      analyticsTitle: 'Weekly & Monthly Clinic Booking Analytics',
      analyticsDesc: 'Visual charts showing booked appointments per week and month to assist doctors in time management.',
      weeklyChartTitle: 'Weekly Booked Appointments',
      weeklyChartDesc: 'Weekly booking volume trend across the center.',
      monthlyChartTitle: 'Monthly Booked Appointments',
      monthlyChartDesc: 'Monthly distribution of booked appointments across the year.',
      yearLabel: 'Year:',
      busiestWeekLabel: 'Peak Week:',
      busiestMonthLabel: 'Peak Month:',
      totalBookedWord: 'Total Booked',
      chartAttended: 'Attended',
      chartUpcoming: 'Upcoming / Confirmed',
      chartBooked: 'Total Booked',
      dailySlotsChartTitle: 'Appointments Per Day (from Booked Slots)',
      dailySlotsChartDesc: 'Daily distribution of booked appointments across the clinic’s doctors.',
      dailySlotsCountLabel: 'Booked Slots',
      dailySlotsTotalLabel: 'Total Booked Slots:',
      dailySlotsPeakLabel: 'Peak Day:',
      noDailySlotsData: 'No booked slots recorded for this clinic in the selected year.',
      permissions: {
        appointments_manage: 'Manage Appointments',
        reception: 'Patient Reception & Check-in',
        services_edit: 'Update Center Services',
        reports_view: 'View Clinic Reports',
      },
      scanQrBtn: 'Scan QR (Instant Lookup)',
    },
    admin: {
      restrictedTitle: 'Restricted to Central Administration Only',
      restrictedDesc: 'This dashboard is dedicated to the platform central administrator to verify credentials, approve doctors and clinics, and inspect complaints and audit logs.',
      dashboardTitle: 'Central Administration Dashboard',
      dashboardDesc: 'Live Sudan-wide platform analytics, credential verification, doctor/clinic approvals, and immutable security audit log.',
      seedDataBtn: 'Seed Sudan Reference Data',
      seedingData: 'Seeding...',
      kpiDoctors: 'Registered Doctors',
      kpiClinics: 'Clinics & Centers',
      kpiActivePatients: 'Active Patients',
      kpiTotalBookings: 'Total Bookings',
      kpiOpenComplaints: 'Open Complaints',
      approvedWord: 'approved',
      pendingWord: 'pending',
      totalAccountsSuffix: 'registered accounts',
      acrossAllStates: 'Across all states',
      pendingApprovalsSuffix: 'pending approvals',
      tabOverview: 'Live Analytics',
      tabApprovals: 'Approvals',
      tabUsers: 'Users',
      tabComplaintsReviews: 'Complaints & Reviews',
      tabAudit: 'Audit Log',
      loadingData: 'Loading live central admin data...',
      stateChartTitle: 'Geographic Distribution of Doctors, Clinics & Bookings by State',
      stateChartDesc: 'Live chart updating automatically whenever a doctor, clinic, or appointment is registered.',
      noStateChartData: 'No state data yet — click "Seed Sudan Reference Data" above.',
      approvalPieTitle: 'Accreditation Status Breakdown',
      approvalPieDesc: 'Proportion of approved facilities and doctors vs pending requests.',
      noApprovalPieData: 'No accreditation requests recorded yet.',
      compositionTitle: 'Platform Balance: Patients, Doctors & Clinics',
      compositionDesc: 'Live comparison of active patients, healthcare providers, and total visits.',
      stateTableTitle: 'Live Coverage Summary by State',
      noDataAvailable: 'No data available.',
      colState: 'State',
      colDoctors: 'Doctors',
      colClinics: 'Clinics',
      colBookings: 'Bookings',
      doctorsQueueTitle: 'Doctor Applications & Credentials',
      noDoctorsRegistered: 'No doctor profiles registered yet.',
      clinicsQueueTitle: 'Clinics & Medical Centers',
      noClinicsRegistered: 'No medical centers registered yet.',
      colDoctorSpecialty: 'Doctor & Specialty',
      colLicenseQual: 'License & Qualification',
      colStateFee: 'State & Fee',
      colStatus: 'Status',
      colDecision: 'Admin Decision',
      colCenterType: 'Center & Type',
      colHealthLicense: 'Health License',
      colStateLocality: 'State & Locality',
      approveBtn: 'Approve',
      rejectBtn: 'Reject',
      suspendBtn: 'Suspend',
      usersTitle: 'User Account Management',
      colUser: 'User',
      colEmail: 'Email',
      colRole: 'Role',
      colAction: 'Action',
      activeUser: 'Active',
      suspendedUser: 'Suspended',
      suspendAccountBtn: 'Suspend Account',
      reactivateAccountBtn: 'Reactivate',
      complaintsTitle: 'Submitted Complaints & Reports',
      noComplaints: 'No complaints recorded.',
      statusPrefix: 'Status:',
      resolutionPrefix: 'Resolution:',
      resolveComplaintBtn: 'Resolve & Close',
      reviewsTitle: 'Review Moderation',
      noReviews: 'No patient reviews submitted yet.',
      noComment: 'No written comment',
      hideReviewBtn: 'Hide Review',
      republishReviewBtn: 'Republish',
      auditTitle: 'Immutable Security & Operations Audit Log',
      noAuditLogs: 'No audit events recorded yet.',
      colActorRole: 'Actor & Role',
      colOperation: 'Action',
      colTarget: 'Target',
      colDetails: 'Details',
      reasonLabel: 'Documented Reason / Admin Note',
      reasonPlaceholder: 'Enter documented reason for the user and audit trail...',
      confirmDecisionBtn: 'Confirm Decision',
      chartDoctors: 'Doctors',
      chartClinics: 'Clinics',
      chartBookings: 'Bookings',
      chartCount: 'Count',
      pieApproved: 'Approved & Live',
      piePending: 'Pending Review',
      pieRejectedSuspended: 'Rejected / Suspended',
      compPatients: 'Active Patients',
      compDoctors: 'Doctors',
      compClinics: 'Clinics',
      compBookings: 'Total Bookings',
    },
    tasks: {
      title: "Today's Tasks & Upcoming Appointments",
      doctorDesc: 'Interactive cards to track patient arrival and mark Attended or No Show in one click.',
      clinicDesc: 'Manage clinic patient check-in and update attendance status immediately upon arrival.',
      scopeUpcomingToday: "Upcoming & Today's Tasks",
      scopeTodayOnly: 'Today Only',
      scopeAllDone: 'Case History',
      kpiToday: "Today's Visits",
      kpiUpcoming: 'Upcoming Pending Tasks',
      kpiAttended: 'Attended',
      kpiNoShow: 'No Show',
      kpiArrivedWaiting: 'Arrived (Waiting)',
      loading: "Loading today's tasks...",
      emptyTitle: 'No appointment tasks match this filter right now',
      emptyDesc: 'New patient bookings will appear here as interactive cards for quick attendance updates.',
      todayBadge: 'Today',
      arrivedBannerBadge: 'Arrived at Clinic',
      arrivedAtPrefix: 'Checked in at',
      arrivedNote: 'Patient is at the clinic awaiting consultation',
      visitReasonPrefix: 'Visit reason:',
      generalConsult: 'General medical consultation',
      feePrefix: 'Fee:',
      confirmBtn: 'Confirm',
      attendedBtn: 'Attended',
      noShowBtn: 'No Show',
      completedNote: 'Patient attendance documented and visit completed',
      noShowNote: 'Patient marked as no-show for this appointment',
      ehrBtn: 'EHR',
      messageBtn: 'Message',
    },
    chat: {
      patientTitle: 'Secure Messaging with Doctors',
      doctorTitle: 'Patient Inquiries & Messaging Center',
      patientDesc: 'Message your doctor directly for quick questions about appointments or preparation.',
      doctorDesc: 'Receive and respond to patient appointment inquiries over a secure, logged channel.',
      secureBadge: 'Secure chat persisted in Firebase',
      startNewTitle: 'Start New Conversation',
      availableSuffix: 'available',
      selectDoctorPlaceholder: 'Select an approved doctor...',
      selectPatientPlaceholder: 'Select a patient from bookings...',
      openBtn: 'Open',
      noThreadsYet: 'No conversations yet. Select a contact above to start messaging.',
      newThreadBadge: 'New Thread',
      youPrefix: 'You',
      emptyStateTitle: 'Select a thread or start a new chat',
      emptyStateDescPatient: 'Choose any approved doctor from the sidebar to view messages and send inquiries.',
      emptyStateDescDoctor: 'Choose any patient from your bookings in the sidebar to reply to inquiries.',
      appointmentBadgePrefix: 'Appt:',
      noMessagesYet: 'Start the conversation by asking about your appointment or preparation.',
      roleDoctor: 'Doctor',
      rolePatient: 'Patient',
      refPlaceholder: 'Appointment reference (optional, e.g. Thursday 04:00 PM)',
      messagePlaceholder: 'Type your message or question here...',
      sendBtn: 'Send',
      sendingBtn: 'Sending...',
      nowLabel: 'Now',
    },
    reminders: {
      ariaLabel: 'Upcoming medical appointment alerts',
      previewTitle: '24h Appointment Reminder Preview',
      autoTitle: 'Reminder: Appointment within 24 hours',
      closeAria: 'Dismiss alert',
      whatsappEnabledNote: 'WhatsApp active',
      detailsBtn: 'Appointment Details',
      whatsappBtn: 'WhatsApp Reminder',
      dismissBtn: 'Got it',
      medAutoTitle: 'Medication Dose Reminder',
      medPreviewTitle: 'Medication Alert Preview',
      medDoseTimeLabel: 'Scheduled time:',
      medMarkTakenBtn: 'Mark Dose Taken',
      medOpenMedsBtn: 'Current Medications',
      medPreDose15Title: 'Alert: Dose Due in 15 Minutes',
      medDueInMinsSuffix: 'min remaining',
      urgent30MinTitle: 'Urgent Alert: Appointment Within 30 Minutes!',
    },
    whatsapp: {
      title: 'User Settings, Dark Mode & WhatsApp Alerts',
      subtitle: 'Customize app appearance and appointment alerts in-app and via WhatsApp',
      savedSuccess: 'Phone number and WhatsApp notification settings saved successfully.',
      invalidPhoneError: 'Please enter a valid Sudan or international phone number (e.g. 0912345678 or +249912345678).',
      saveError: 'Failed to save phone number and notification settings.',
      phoneLabel: 'WhatsApp Phone Number (Sudan or International)',
      validPreviewPrefix: 'Verified WhatsApp international format:',
      invalidPreview: 'Enter a valid number (e.g. 0912345678 or +249912345678)',
      enableWaTitle: 'Enable WhatsApp Appointment Alerts',
      enableWaDesc: 'Attach instant WhatsApp dispatch reminders for your linked number 24h before visits.',
      enableToastTitle: 'Enable In-App Toast Notifications',
      enableToastDesc: 'Automatically show visual reminder toasts inside the app 24h before visits and 15m before doses.',
      saveBtn: 'Save Settings',
      darkModeTitle: 'Enable Dark Mode',
      darkModeDesc: 'Switch the entire app palette to comfortable dark colors and sync preference in Firebase.',
      darkModeOn: 'On',
      darkModeOff: 'Off',
    },
    pdf: {
      modalTitle: 'Preview & Export Medical Record (PDF)',
      modalSubtitle: 'Comprehensive summary of your visits, diagnostic reports, and vitals timeline to share with any external doctor.',
      printBtn: 'Print',
      downloadBtn: 'Download PDF',
      downloadJsonBtn: 'Download JSON',
      generatingBtn: 'Generating PDF...',
      headerEyebrow: 'Sudanese Smart Medical Platform · Unified Electronic Health Record',
      reportTitle: 'Comprehensive Patient Medical Record Report',
      reportSubtitle: 'Portable clinical summary authorized for external specialist consultation',
      exportDateLabel: 'Export Date:',
      sec1Title: '1. Personal & Baseline Health Data',
      fullNameLabel: 'Full Name',
      dobLabel: 'Date of Birth',
      bloodTypeLabel: 'Blood Type',
      heightWeightBmiLabel: 'Height / Weight / BMI',
      allergiesLabel: 'Drug & Food Allergies',
      noAllergies: 'No allergies recorded',
      chronicLabel: 'Chronic Conditions',
      noChronic: 'No chronic conditions recorded',
      emergencyLabel: 'Emergency Contact:',
      sec2Title: '2. Past Medical Visits Summary',
      noPastVisits: 'No completed medical visits recorded as of export date.',
      colDate: 'Date',
      colDoctorSpec: 'Doctor & Specialty',
      colClinicLoc: 'Clinic / Location',
      colTypeReason: 'Type & Reason',
      sec3Title: '3. Diagnostic Reports & Prescriptions',
      noReports: 'No diagnostic reports or prescriptions recorded yet.',
      complaintPrefix: 'Complaint:',
      diagnosisPrefix: 'Diagnosis:',
      medsPrefix: 'Medications:',
      notesPrefix: 'Notes & Recommendations:',
      nutritionPrefix: 'Nutrition Plan:',
      sec4Title: '4. Health Vitals Timeline',
      noVitals: 'No vital readings recorded yet.',
      colSource: 'Source',
      colBp: 'Blood Pressure',
      colWeight: 'Weight (kg)',
      colGlucose: 'Glucose (mg/dL)',
      colHr: 'Heart Rate (bpm)',
      footerNote: 'Sudanese Smart Medical Platform · Electronically exported under patient authorization',
      cmUnit: 'cm',
      kgUnit: 'kg',
      notRecorded: 'Not recorded',
      notSpecified: 'Not specified',
    },
    apps: {
      switchAppLabel: 'Switch Application',
      hubEyebrow: 'Unified 3-Application Ecosystem',
      hubTitle: 'Launch any of the 3 dedicated apps or share its direct link',
      hubDesc: 'Structured into three focused applications with separate registration and onboarding tracks for independent Doctors and Clinics / Medical Centers.',
      activeAppBadge: 'Active App',
      openAppBtn: 'Open App',
      copyAppLinkBtn: 'Copy App Link',
      linkCopied: 'Link Copied',
      directLinkLabel: 'Direct share link:',
      copyDoctorLinkBtn: 'Copy Doctor Link',
      copyClinicLinkBtn: 'Copy Clinic Link',
      openLinkBtn: 'Open',
      copyBtn: 'Copy',
      bannerAlt: 'Sudanese Smart Medical Platform Official Banner',
      backToMainBtn: 'Main Platform',
      main: {
        title: 'Main Platform App',
        shortName: 'Main Platform',
        subtitle: 'All-Sudan Directory & Central Admin',
        desc: 'Browse verified doctors and centers across all 18 Sudanese states, explore the interactive map, and manage central accreditation.',
        openDirBtn: 'Explore Main Directory',
        openAdminBtn: 'Central Admin',
      },
      provider: {
        title: 'Doctor & Clinic App',
        shortName: 'Doctor & Clinic',
        subtitle: 'Separated Doctor & Clinic Registration',
        desc: 'Dedicated healthcare provider workspace separating Doctor registration from Clinic/Center registration, complete with Today Tasks and Recharts analytics.',
        registerDoctorBtn: 'Doctor Registration & Portal',
        registerClinicBtn: 'Clinic Registration & Portal',
        separationTitle: 'Separated Registration Tracks: Doctor vs. Clinic / Medical Center',
        separationDesc: 'Choose whether to register and operate as an individual Doctor or as a Clinic / Medical Center with isolated facility records and staff permissions.',
        doctorTrackTitle: 'Doctor Registration & Workspace',
        doctorTrackDesc: 'For doctors (independent or clinic-affiliated): submit medical license, specialty, fees, schedule, manage appointments, and author EHR reports.',
        doctorTrackCtaSignedOut: 'Register / Sign In as Doctor',
        doctorTrackCtaSwitch: 'Activate Doctor Role on Account',
        doctorTrackOpenBtn: 'Open Doctor Registration & Form',
        doctorTrackActiveBadge: 'Doctor Track Active',
        clinicTrackTitle: 'Clinic / Medical Center Registration',
        clinicTrackDesc: 'For clinics, medical centers, and hospitals: submit facility license, location, staff roster, and manage isolated clinic schedules.',
        clinicTrackCtaSignedOut: 'Register / Sign In as Clinic',
        clinicTrackCtaSwitch: 'Activate Clinic Admin Role on Account',
        clinicTrackOpenBtn: 'Open Clinic Registration & Form',
        clinicTrackActiveBadge: 'Clinic Track Active',
      },
      patient: {
        title: 'Patients App',
        shortName: 'Patients App',
        subtitle: 'Booking, Unified EHR & Medications',
        desc: 'Book urgent 24h slots, digital clinic check-in, track your next active medication dose with 15-min alerts, save favorites, and WhatsApp reminders.',
        openPortalBtn: 'Open Patient Portal',
        openBookingBtn: 'Book a Doctor',
      },
    },
    pwa: {
      installAppBtn: 'Install App',
      installOnIosBtn: 'Install on iOS',
      iosModalTitle: 'Install on iPhone / iPad',
      iosStep1: '1. Tap the Share button in the Safari toolbar.',
      iosStep2: '2. Scroll down and tap Add to Home Screen.',
      offlineBanner: 'Offline Mode — Cached data is being used.',
    },
    qr: {
      scannerBadge: 'Reception QR Scanner',
      scannerTitle: 'Scan QR Code to Retrieve Appointment or EHR',
      scannerDesc: 'Use live camera scanning, upload a QR image, or paste the QR payload / appointment ID for instant lookup.',
      startCameraBtn: 'Start Camera Scan',
      stopCameraBtn: 'Stop Camera',
      uploadImageBtn: 'Upload QR Image',
      manualPlaceholder: 'Paste QR data or enter appointment ID (e.g. apt_...)',
      lookupBtn: 'Retrieve Details',
      lookingUp: 'Looking up...',
      generating: 'Generating QR code...',
      copied: 'Copied',
      cameraUnavailable: 'Camera is not available here. Upload a QR image or enter the ID manually.',
      cameraPermissionDenied: 'Camera access was denied or blocked. Upload a QR image or paste the ID manually.',
      decodeImageFailed: 'Could not detect a QR code in the uploaded image.',
      invalidPayload: 'Invalid QR code format for appointments or patient records.',
      notFoundError: 'Appointment not found or you lack access permission.',
      retrievedAppointmentTitle: 'Retrieved Appointment Details',
      retrievedEhrTitle: 'Patient Emergency Medical Record Summary',
      patientLabel: 'Patient',
      doctorLabel: 'Doctor',
      clinicLabel: 'Clinic / Center',
      dateTimeLabel: 'Date & Time Slot',
      feeLabel: 'Consultation Fee',
      reasonLabel: 'Visit Reason',
      markArrivedBtn: 'Check In Patient',
      statusUpdatedMsg: 'Appointment status updated successfully.',
    },
  },
};
