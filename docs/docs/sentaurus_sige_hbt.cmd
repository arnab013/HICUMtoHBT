;------------------------------------------------------------
(sde:clear)
;-------------------------------------------------------------------------------------
; Unified coordinate system for structure generation

(if (string=? "@Type@" "npn")
 (begin
  (define DopBase "BoronActiveConcentration")
  (define DopEC   "ArsenicActiveConcentration")
 )
 (begin
  (define DopBase "ArsenicActiveConcentration")
  (define DopEC   "BoronActiveConcentration")
 )
)

(define Xmin  0.0)   ; [um] Left extend of the device
(define Xmax  1.2)   ; [um] Right extend of the device
(define Xcol  0.9)   ; [um] Lateral center location of the collector
(define Xbcm  0.45)  ; [um] Base Contact right

(define Wbas  0.45)  ; [um] Base width
(define Wcol  0.2)   ; [um] Sub-Collector width at the top surface
(define Wemi  0.15)  ; [um] Emitter width

(define dWc   0.1)   ; [um] Collector/SubCollector width increase
                     ; (Trench insulation slope)
(define dWb   0.075) ; [um] Base/base contact overlap

(define Hsub  0.3)   ; [um] Substrate height
(define Hcol  0.3)   ; [um] Collector height
(define Hbas  0.075) ; [um] Base height
(define Hbc   0.075) ; [um] Poly-base contact height
(define Hemi  0.225) ; [um] Poly-emitter contact height

(define PeakBas 5.0e18 ) ; [cm-3] Peak value of the base implant profile
(define PeakEmi 5.0e19 ) ; [cm-3] Peak value of the emitter implant profile
(define PeakCol 1.0e18 ) ; [cm-3] Peak value of the base implant profile

;-----------------------------------------------------------------------
(define Xer (+ Xmin (* 0.5 Wemi))) ; Emitter

(define Xbr (+ Xmin (* 0.5 Wbas))) ; Base

(define Xcr (+ Xbr dWc)) ; Collector width at substrate

(define Xbcr (- Xbr dWb)) ; Poly-Base contact/Base overlap

(define Xscl (- Xcol (* 0.5 Wcol)))
(define Xscr (+ Xcol (* 0.5 Wcol)))
(define Xsl  (- Xscl dWc))
(define Xsr  (+ Xscr dWc))
;-----------------------------------------------------------------------
(define Ybas 0.0)
(define Ymax (+ Ybas Hcol Hsub))
(define Ysub (+ Ybas Hcol))
(define Yemi (- Ybas Hbas))
(define Ybc  (- Yemi Hbc))
(define Ymin (- Yemi Hemi))

;-----------------------------------------------------------------------
; Creating polygonal regions
(sdegeo:create-polygon
 (list  (position  Ymax Xmin 0.0)
        (position  Ymax Xmax 0.0)
        (position  Ysub Xmax 0.0)
        (position  Ysub Xsr  0.0)
        (position  Ybas Xscr 0.0)
        (position  Ybas Xscl 0.0)
        (position  Ysub Xsl  0.0)
        (position  Ysub Xcr  0.0)
        (position  Ybas Xbr  0.0)
        (position  Ybas Xmin 0.0)
        (position  Ymax Xmin 0.0) )
 "Silicon" "R.Substrate")

;-----------------------------------------------------------------------
; Creating rectangular regions
(sdegeo:create-rectangle
	(position Yemi Xmin 0.0) (position Ybas Xbr 0.0)
	"SiliconGermanium" "R.SiGeBase")
(sdegeo:create-rectangle
	(position  Yemi Xbcr 0.0) (position Ybc Xbcm 0.0)
	"PolySilicon" "R.Baseright")
(sdegeo:create-rectangle
	(position Yemi Xmin 0.0) (position Ymin Xer 0.0)
	"PolySilicon" "R.Emitter")
(define CollectorCont (sdegeo:create-rectangle
	(position  Ybas Xscl 0.0) (position Ymin Xscr 0.0)
	"Aluminium" "R.CollectorCont"))
(define BaseContR (sdegeo:create-rectangle
	(position Ybc Xbr 0.0) (position Ymin Xbcm 0.0)
	"Aluminium" "R.BaseContR"))

; Creating device insulation using overlap resolution
(sdegeo:set-default-boolean "BAB")
(sdegeo:create-rectangle
	(position Ymax Xmin 0.0) (position Ymin Xmax 0.0) "Oxide" "R.Insulation")

;-----------------------------------------------------------------------
; Defining contacts
(sdegeo:define-contact-set "base"      4.0 (color:rgb 1.0 0.0 0.0 ) "##" )
(sdegeo:define-contact-set "emitter"   4.0 (color:rgb 0.0 1.0 0.0 ) "##" )
(sdegeo:define-contact-set "collector" 4.0 (color:rgb 0.0 0.0 1.0 ) "##" )

(sdegeo:set-current-contact-set "base")
(sdegeo:set-contact-boundary-edges BaseContR "base")
(sdegeo:delete-region BaseContR )

(sdegeo:set-current-contact-set "collector")
(sdegeo:set-contact-boundary-edges CollectorCont "collector")
(sdegeo:delete-region CollectorCont)

(sdegeo:set-current-contact-set "emitter")
(sdegeo:define-2d-contact (find-edge-id (position Ymin (+ Xmin (* 0.25 Wemi)) 0.0)) "emitter")

;-----------------------------------------------------------------------
; Constant Doping Regions
(sdedr:define-constant-profile "Const.Substrate"
	DopEC 1.0e17 )
(sdedr:define-constant-profile-region  "PlaceCD.Substrate"
	"Const.Substrate" "R.Substrate" )

(sdedr:define-refeval-window "RW.BaseContactR"
	"Rectangle" (position  Yemi Xbcr 0.0) (position Ybc Xbcm 0.0))
(sdedr:define-constant-profile "Const.BaseContact"
	DopBase 1.0e20 )
(sdedr:define-constant-profile-placement "PlaceCD.BaseContactR"
	"Const.BaseContact" "RW.BaseContactR" (* 0.25 Hbas) )

(sdedr:define-constant-profile "Const.EmitterContact"
	DopEC 1.0e20 )
(sdedr:define-constant-profile-region  "PlaceCD.EmitterContact"
	"Const.EmitterContact" "R.Emitter" )

;-----------------------------------------------------------------------
; "Implants"

(sdedr:define-refeval-window "BaseLine.ColCont" "Line"
	(position Ybas Xsl 0.0)
	(position Ybas Xsr 0.0) )
(sdedr:define-gaussian-profile "Impl.ColContprof"
	DopEC
	"PeakPos" 0.0 "PeakVal" 1.0e20
	"ValueAtDepth" 1.0e19 "Depth" (* 0.5 Hcol)
	"Gauss"  "Factor" 0.0)
(sdedr:define-analytical-profile-placement "Impl.ColCont"
	"Impl.ColContprof" "BaseLine.ColCont" "Negative" "NoReplace" "Eval")

(sdedr:define-refeval-window "BaseLine.Base" "Line"
	(position (* 0.5 (+ Yemi Ybas)) Xmin 0.0)
	(position (* 0.5 (+ Yemi Ybas)) Xbr 0.0) )
(sdedr:define-gaussian-profile "Impl.Baseprof"
	DopBase
	"PeakPos" 0.0 "PeakVal" PeakBas
	"ValueAtDepth" (* 0.1 PeakBas) "Depth" (* 0.35 Hbas)
	"Gauss"  "Factor" 0.0)
(sdedr:define-analytical-profile-placement "Impl.Base"
	"Impl.Baseprof" "BaseLine.Base" "Both" "NoReplace" "Eval")

(sdedr:define-refeval-window "BaseLine.SubCol" "Line"
	(position Ysub Xmin 0.0)
	(position Ysub Xmax 0.0) )
(sdedr:define-gaussian-profile "Impl.SubColprof"
	DopEC
	"PeakPos" 0.0 "PeakVal" 2.0e19
	"ValueAtDepth" 1.0e18 "Depth" (* 0.4 Hcol)
	"Gauss"  "Factor" 0.0)
(sdedr:define-analytical-profile-placement "Impl.SubCol"
	"Impl.SubColprof" "BaseLine.SubCol" "Both" "NoReplace" "Eval")

(sdedr:define-refeval-window "BaseLine.Col" "Line"
	(position (* 0.25 (+ Ysub Ybas)) Xmin 0.0)
	(position (* 0.25 (+ Ysub Ybas)) Xbcr 0.0) )
(sdedr:define-gaussian-profile "Impl.Colprof"
	DopEC
	"PeakPos" 0.0 "PeakVal" PeakCol
	"ValueAtDepth" (* 0.1 PeakCol) "Depth" (* 0.35 Hcol)
	"Gauss"  "Factor" 0.8)
(sdedr:define-analytical-profile-placement "Impl.Col"
	"Impl.Colprof" "BaseLine.Col" "Both" "NoReplace" "Eval")

(sdedr:define-refeval-window "BaseLine.Emi" "Line"
	(position Yemi Xmin 0.0)
	(position Yemi Xer 0.0) )
(sdedr:define-gaussian-profile "Impl.Emiprof"
	DopEC
	"PeakPos" 0.0 "PeakVal" PeakEmi
	"ValueAtDepth" 6.0e16 "Depth" (* 0.5 Hbas)
	"Gauss"  "Factor" 0.8)
(sdedr:define-analytical-profile-placement "Impl.Emi"
	"Impl.Emiprof" "BaseLine.Emi" "Negative" "NoReplace" "Eval")

; Linear mole fraction profile 0.16 at base-col to 0 at base-emitter
(sdedr:define-refeval-window "BaseLine.Mole" "Line"
	(position Yemi (- Xmin 10.0) 0.0)
	(position Yemi (+ Xmax 10.0) 0.0) )
(sdedr:define-analytical-profile "Prof.Mole"
	"xMoleFraction"
	(string-append "a=(@Xbc@-@Xeb@)/" (number->string Hbas))
	"@Xeb@+a*x"
	@Xeb@)
(sdedr:define-analytical-profile-placement "Place.Mole"
	"Prof.Mole" "BaseLine.Mole" "Negative" "NoReplace"
	"Eval")
